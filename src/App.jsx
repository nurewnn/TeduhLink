import { useEffect, useMemo, useState } from 'react'
import { FRESHNESS_MS, demoStops, displayOccupancy, loadStops, matchStops, relativeUpdate } from './lib/stops'

const amenityLabels = {
  shelter: 'Shelter',
  charging: 'Phone charging',
}

const statusCopy = {
  available: { label: 'Bay available', tone: 'available' },
  occupied: { label: 'Bay occupied', tone: 'occupied' },
  unknown: { label: 'Status unknown', tone: 'unknown' },
}

function App() {
  const [needs, setNeeds] = useState(['shelter', 'charging'])
  const [stops, setStops] = useState(demoStops)
  const [dataMode, setDataMode] = useState('demo')
  const [phase, setPhase] = useState('available')
  const [now, setNow] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(tick)
  }, [])

  useEffect(() => {
    let active = true
    const refreshStops = () => loadStops()
      .then(({ stops: loadedStops, mode }) => {
        if (!active) return
        setStops(loadedStops.length ? loadedStops : demoStops)
        setDataMode(mode)
        setError('')
      })
      .catch((loadError) => {
        if (!active) return
        setError(`Live data unavailable: ${loadError.message}. Showing the demo safely.`)
        setStops(demoStops)
        setDataMode('demo')
      })
      .finally(() => active && setLoading(false))

    refreshStops()
    const poll = window.setInterval(refreshStops, 10_000)
    return () => {
      active = false
      window.clearInterval(poll)
    }
  }, [])

  const visibleStops = useMemo(() => {
    if (dataMode !== 'demo') return matchStops(stops, needs, now)
    const simulatedStops = stops.map((stop) => {
      if (stop.siteCode !== 'stop-a') return stop
      const observedAt = phase === 'unknown' ? new Date(now - FRESHNESS_MS - 1_000).toISOString() : new Date(now).toISOString()
      return {
        ...stop,
        bay: {
          ...stop.bay,
          occupancy: phase === 'occupied' ? 'occupied' : 'available',
          deviceStatus: phase === 'offline' ? 'offline' : 'online',
          observedAt,
        },
      }
    })
    return matchStops(simulatedStops, needs, now)
  }, [dataMode, needs, now, phase, stops])

  const recommendation = visibleStops.find((stop) => stop.matchesNeeds && stop.status === 'available')
  const hasUncertainMatch = visibleStops.some((stop) => stop.matchesNeeds && stop.status === 'unknown')

  const toggleNeed = (need) => {
    setNeeds((current) => current.includes(need) ? current.filter((item) => item !== need) : [...current, need])
  }

  return (
    <main className="app-shell">
      <div className="rain rain-one" />
      <div className="rain rain-two" />
      <nav className="topbar" aria-label="TeduhLink navigation">
        <a className="wordmark" href="#top" aria-label="TeduhLink home"><span>t</span>eduh<span>link</span></a>
        <div className="topbar-meta"><i className="pulse-dot" /> Cyberjaya · rider mode</div>
      </nav>

      <section className="hero" id="top">
        <div className="eyebrow"><span className="eyebrow-dot" /> LIVE STOP FINDER</div>
        <h1>Find the next<br /><em>good place</em> to pause.</h1>
        <p className="hero-copy">A calmer way to choose a participating rider stop—using listed amenities and the latest bay observation.</p>

        <div className="need-panel">
          <div className="need-heading">
            <span>What do you need right now?</span>
            <small>Choose while stationary</small>
          </div>
          <div className="need-buttons">
            {Object.entries(amenityLabels).map(([key, label]) => (
              <button key={key} className={`need-chip ${needs.includes(key) ? 'is-active' : ''}`} onClick={() => toggleNeed(key)} aria-pressed={needs.includes(key)}>
                <span className={`chip-icon ${key}`}>{key === 'shelter' ? '⌂' : '↯'}</span>{label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="content-grid" aria-live="polite">
        <article className={`recommendation ${recommendation ? 'has-match' : ''}`}>
          <div className="recommendation-topline"><span>YOUR BEST NEXT STOP</span><span className={`data-source ${dataMode}`}>{dataMode === 'live' ? 'LIVE DATA' : 'DEMO MODE'}</span></div>
          {loading ? <div className="loading-line">Checking stop information…</div> : recommendation ? <>
            <div className="recommendation-title"><span className="route-mark">↗</span><h2>{recommendation.name}</h2></div>
            <p>{recommendation.accessDetails}</p>
            <div className="recommendation-reasons">
              <span><b>✓</b> meets your selected needs</span>
              <span><b>✓</b> fresh bay is available</span>
              <span><b>↗</b> demo estimate: {recommendation.distance}</span>
            </div>
          </> : <>
            <div className="recommendation-title uncertain"><span className="route-mark">?</span><h2>No stop can be confirmed yet.</h2></div>
            <p>{hasUncertainMatch ? 'A suitable stop has incomplete or stale live information. Check its status before heading there.' : 'No listed stop currently meets every selected need with a confirmed available bay.'}</p>
          </>}
          <div className="observation-note"><span>Important:</span> Availability is an observation, not a reservation.</div>
        </article>

        <aside className="integrity-card">
          <div className="integrity-icon">✦</div>
          <div><strong>Truth over guessing.</strong><p>Old, missing, or unreliable sensor readings become <b>unknown</b>—never quietly “available.”</p></div>
        </aside>
      </section>

      {error && <div className="error-strip" role="status">{error}</div>}

      <section className="stops-section">
        <div className="section-heading"><div><span className="eyebrow">PARTICIPATING DEMO STOPS</span><h2>Compare before you move.</h2></div><span className="count-label">{visibleStops.length} OPTIONS</span></div>
        <div className="stop-grid">
          {visibleStops.map((stop, index) => <StopCard key={stop.id} stop={stop} rank={index + 1} now={now} recommended={recommendation?.id === stop.id} />)}
        </div>
      </section>

      {dataMode === 'demo' && <section className="lab-panel">
        <div><span className="eyebrow">DEMO CONTROL ROOM</span><h2>Stress-test the promise.</h2><p>These controls simulate the physical Stop A sensor feed. They never write to your database.</p></div>
        <div className="scenario-controls" aria-label="Demo scenarios">
          <button className={phase === 'available' ? 'active' : ''} onClick={() => setPhase('available')}><i /> Bay free</button>
          <button className={phase === 'occupied' ? 'active' : ''} onClick={() => setPhase('occupied')}><i /> Bay occupied</button>
          <button className={phase === 'unknown' ? 'active' : ''} onClick={() => setPhase('unknown')}><i /> Stale signal</button>
          <button className={phase === 'offline' ? 'active' : ''} onClick={() => setPhase('offline')}><i /> Node offline</button>
        </div>
      </section>}

      <footer><span>TEDUHLINK / PROTOTYPE</span><span>Listed · Measured · Simulated · Unknown</span></footer>
    </main>
  )
}

function StopCard({ stop, rank, now, recommended }) {
  const status = statusCopy[stop.status]
  const source = stop.bay?.source ?? 'unknown'
  return <article className={`stop-card ${recommended ? 'is-recommended' : ''}`}>
    <div className="stop-card-top"><span className="stop-index">0{rank}</span>{recommended && <span className="picked-badge">PICKED FOR YOU</span>}</div>
    <h3>{stop.name}</h3>
    <p>{stop.accessDetails}</p>
    <div className="amenities">{Object.entries(amenityLabels).map(([key, label]) => <span key={key} className={stop.amenities.includes(key) ? '' : 'missing'}>{key === 'shelter' ? '⌂' : '↯'} {label}</span>)}</div>
    <div className={`status-block ${status.tone}`}><div><span className="status-orb" /><strong>{status.label}</strong></div><small>{relativeUpdate(stop.bay?.observedAt, now)}</small></div>
    <div className="card-footer"><span className={`source-tag ${source}`}>{source}</span><span>{stop.distance} <small>demo estimate</small></span></div>
  </article>
}

export default App
