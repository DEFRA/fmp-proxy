# fmp-proxy

A lightweight Hapi proxy that keeps third-party mapping credentials server-side.

## What it provides

- `GET /health-check` simple service health probe
- `GET /os-token` retrieves an Ordnance Survey OAuth token (cached in memory)
- `GET|POST /proxy/os/{path*}` forwards to `https://api.os.uk/{path*}` with `Authorization: Bearer <token>` injected server-side
- `GET|POST /proxy/esri/{path*}` forwards to `agol.serviceUrl/{path*}` with query parameter `token=<short-lived AGOL token>` injected server-side

## Environment variables

Copy `.env.example` to `.env` and set real values.

- `FMPPROXYPORT` (default `3005`)
- `agolClientId` required
- `agolClientSecret` required
- `agolServiceId` required
- `ESRI_TOKEN_DURATION_MINUTES` optional (defaults to `7200`)
- `ordnanceSurveyOsGetCapabilitiesUrl` required (can be empty string)
- `ordnanceSurveyOsMapsUrl` required
- `ordnanceSurveyOsNamesUrl` required
- `ordnanceSurveyOsSearchKey` required (can be empty string)
- `ordnanceSurveyOsClientId` required
- `ordnanceSurveyOsClientSecret` required
- `OS_TOKEN_URL` optional (defaults to OS production token endpoint)

## Run locally

```bash
npm install
npm start
```

## Run with debug
```bash
PROXY_DEBUG=true npm start
```

## Production build

```bash
npm run build
node build/index.js
```

`npm run build` uses webpack to bundle the service and its dependencies into `build/index.js`. The `build/` folder is not tracked by git. The bundle is self-contained, so `node_modules` is not needed at runtime. Environment variables (or a `.env` file in the working directory) are still required.

## Docker

```bash
docker build -t fmp-proxy .
docker run --rm -p 3005:3000 --env-file .env fmp-proxy
```

The image is built in two stages. The first runs webpack. The final image contains only `build/index.js` and runs `node build/index.js` as the `node` user. The container listens on port `3000` internally. `-p 3005:3000` publishes it on host port `3005`. `.env` is excluded from the image, so pass environment variables at runtime, for example with `--env-file`. `FMPPROXYPORT` is set to `3000` in the image, so leave it out of the env file or set it to `3000`.

> **Note:** Docker's `--env-file` does not strip quotes the way `dotenv` does. A value such as `KEY='value'` or `KEY="value"` is passed to the container with the quotes included, which can fail config validation and stop the container at startup. Do not quote values in an env file used with Docker. Inline comments (`KEY=value # comment`) are also kept as part of the value.

### Running on WSL with mirrored networking

If Docker runs inside WSL2 (not Docker Desktop) and `.wslconfig` has `networkingMode=mirrored`, ports published with `-p` may not be reachable from a Windows browser. Run the container on the host network instead:

```bash
docker run --rm --network host --env-file .env fmp-proxy
```

With `--network host`, `-p` is ignored and the app listens directly on the port set by `FMPPROXYPORT` in `.env`, for example `3005`. Browse to `http://127.0.0.1:3005/health-check`. Use `127.0.0.1` rather than `localhost`, which may not reach WSL from Windows. This is only needed for local development on WSL. Deployments should use the normal `-p` port mapping.

## Test

```bash
npm run test
```

## Contributing to this project

We do not expect contributions, however if you have something you'd like to contribute please log an issue.

## License
THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

>Contains public sector information licensed under the Open Government licence v3

### About the license
The Open Government Licence (OGL) was developed by the Controller of His Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
