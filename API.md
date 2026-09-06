# API Contract

Base URL is configured in `js/config.js`.

## Resources

The dashboard expects:

- `GET /keys`
- `POST /keys`
- `GET /keys/:id`
- `PATCH /keys/:id`
- `DELETE /keys/:id`
- `GET /devices`
- `PATCH /devices/:id`
- `DELETE /devices/:id`
- `GET /packages`
- `POST /packages`
- `PATCH /packages/:id`
- `DELETE /packages/:id`
- `GET /tweaks`
- `POST /tweaks`
- `PATCH /tweaks/:id`
- `DELETE /tweaks/:id`
- `GET /blacklist`
- `POST /blacklist`
- `PATCH /blacklist/:id`
- `DELETE /blacklist/:id`
- `GET /logs`
- `DELETE /logs/:id`
- `GET /settings/global`
- `PATCH /settings/global`
- `GET /health`

## Client authentication API

Recommended endpoints:

### POST /auth/validate
Request:
```json
{
  "key": "AUTH-...",
  "device_id": "...",
  "package": "com.example.tweak",
  "version": "1.0.0"
}
```

Response should distinguish:
- `valid`
- `invalid`
- `expired`
- `banned`
- `device_mismatch`
- `package_mismatch`

### POST /auth/activate

Same request shape. The server binds a valid key to a permitted device according to its license policy.

### POST /auth/heartbeat

Same identity fields plus optional app/tweak metadata. The server updates `lastUsedAt` and device presence.

## Security

Do not authenticate administrative write access solely by a value stored in the static page. Use a server-side authorization mechanism and validate every resource/action server-side.

## CORS

The API must explicitly allow the GitHub Pages origin(s) you use. Do not use `Access-Control-Allow-Origin: *` together with credentialed requests.
