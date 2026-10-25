# TeduhLink data contract

This contract is the integration boundary between the sensor/network work and the rider interface.

## IDs

- `site_code`: human-readable participating stop ID, e.g. `stop-a`.
- `bay_code`: a bay inside a site, e.g. `bay-1`.
- A measurement describes **one named bay**, never the full site's capacity unless the system explicitly models every bay.

## Observation payload

The protected ingestion service should accept a payload equivalent to:

```json
{
  "site_code": "stop-a",
  "bay_code": "bay-1",
  "occupancy": "occupied",
  "observed_at": "2026-10-25T14:30:00Z",
  "device_status": "online",
  "source": "measured"
}
```

Allowed values:

| Field | Values | Meaning |
| --- | --- | --- |
| `occupancy` | `available`, `occupied`, `unknown` | State observed for the one bay. |
| `device_status` | `online`, `offline`, `unreliable` | Health of the reporting node. |
| `source` | `measured`, `simulated` | Whether the reading comes from the physical model sensor or demo data. |

## Rules the UI must apply

1. Listed amenities are catalogue facts, not live proof that a charger is working.
2. The newest reading wins only when it is within the freshness period.
3. A reading older than 60 seconds is displayed as `unknown` in this starter version.
4. If `device_status` is `offline` or `unreliable`, the interface must not present a confirmed available bay.
5. If no stop can be confirmed as suitable, explain which information is missing rather than silently guessing.

## Ingestion safety

The browser may read public demo data. It must not write sensor readings. The ESP32 must not contain a Supabase service-role key. Use a protected Edge Function or small backend to verify a device secret and insert observations.
