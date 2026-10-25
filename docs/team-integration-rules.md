# TeduhLink team integration rules

Read this before connecting the ESP32, network path, and rider interface.

## One promise we must preserve

TeduhLink recommends a stop using listed amenities and the latest observation of **one named bay**. It does not reserve a bay or claim to measure the entire facility.

## Shared identifiers

| Field | Agreed value for the demo | Owner |
| --- | --- | --- |
| `site_code` | `stop-a` | All members |
| `bay_code` | `bay-1` | Mechatronics + Networking |
| Stop A source | `measured` | Mechatronics |
| Stop B source | `simulated` | AI / CS |

Do not rename these fields without telling the whole team.

## Required update payload

The networking path must send an equivalent JSON payload to the protected ingestion endpoint:

```json
{
  "site_code": "stop-a",
  "bay_code": "bay-1",
  "occupancy": "available",
  "device_status": "online",
  "source": "measured",
  "observed_at": "2026-10-25T14:30:00Z"
}
```

Allowed values only:

| Field | Allowed values |
| --- | --- |
| `occupancy` | `available`, `occupied`, `unknown` |
| `device_status` | `online`, `offline`, `unreliable` |
| `source` | `measured`, `simulated` |

## Rules the app will enforce

1. A fresh, online `available` update may be shown as available.
2. A fresh `occupied` update may be shown as occupied.
3. Any update older than **60 seconds** becomes `unknown`.
4. `offline` or `unreliable` becomes `unknown`, even if the last occupancy value was available.
5. Missing information is never assumed to be a match.
6. Stop B always remains visibly labelled simulated.
7. The rider interface polls the database every 10 seconds during the demo.

## Security boundary

- The ESP32 and rider browser must never contain a Supabase secret key, service-role key, or database password.
- The browser is read-only for demo data.
- The network member sends device readings to a protected server or Supabase Edge Function.
- That trusted endpoint validates the payload, resolves `site_code` + `bay_code`, and inserts an observation.

## Responsibilities

| Member | Must deliver before integration |
| --- | --- |
| Mechatronics | Repeatable occupied / empty sensor output and its exact meaning. |
| Networking | Protected endpoint URL, authentication method, and a successful test payload. |
| AI / CS | Rider UI, explanation rules, database read path, stale-data display, and demo test. |

## Ready-to-connect checklist

- [ ] An object entering Stop A's model bay produces `occupied`.
- [ ] Removing it produces `available`.
- [ ] The update uses exactly `stop-a` and `bay-1`.
- [ ] A timestamp is in ISO 8601 UTC format.
- [ ] The frontend shows the new value within 10 seconds.
- [ ] After 60 seconds without a fresh update, the frontend shows `unknown`.
- [ ] Reconnecting with a fresh update restores the current status.

## Demo story

1. Rider selects shelter and phone charging.
2. Stop A is available, so TeduhLink can recommend it.
3. Occupy the physical model bay; a measured update arrives and the interface recommends Stop B.
4. Disconnect Stop A's node; after the freshness limit, the UI shows `unknown` instead of using old availability.
5. Reconnect; a fresh reading restores the displayed status.
