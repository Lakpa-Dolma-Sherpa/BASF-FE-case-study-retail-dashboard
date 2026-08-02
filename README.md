# Store Performance Dashboard

Internal dashboard for monitoring retail store performance.

## Stack

- React 19
- TypeScript 
- Vite
- Ant Design 6 
- Redux Toolkit 
- Axios
- AG Grid
- D3.js
- Express (mock server)

Requires Node 20.19+ (or 22.12+)

## Setup

```bash
cd retail-dashboard
npm install
npm run dev
```

Starts the mock API on http://localhost:4000 and the app on http://localhost:5173 (requests to `/api` are proxied to the mock server).

## Scripts

| Command | Explanation |
|---|---|
| `npm run dev` | Start mock server and app |
| `npm run dev:web` | App only |
| `npm run dev:server` | Mock server only |
| `npm run build` | Type-check and build |

## Login

| Username | Password |
|---|---|
| `ops_maria` | `password123` |
| `analyst_bob` | `password123` |

## Mock API

The server seeds 90 days of transaction data for 10 stores. Additionally, it simulates real-world conditions (latency on every request as well as occasional errors). Endpoints are documented in `server/index.ts`.

**Treat the server as a third-party API: don't modify it.** 

## Challenge

See the challenge description in the `CHALLENGE.md` file. Document changes in the `SOLUTIONS.md` file.