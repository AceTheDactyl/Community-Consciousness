# Consciousness Field Backend Server

## Quick Start

To fix the backend connection errors, you need to start the backend server:

### Option 1: Start Backend Server (Recommended)

```bash
# In a new terminal, run:
bun run backend/server.ts
```

This will start the backend server on `http://localhost:8081` with all the tRPC endpoints.

### Option 2: Test Backend Connection

You can test if the backend is working by visiting these URLs in your browser:

- Health check: http://localhost:8081/api
- Simple ping: http://localhost:8081/api/ping
- Debug info: http://localhost:8081/api/debug
- tRPC health: http://localhost:8081/api/trpc/health

### Option 3: Run Both Frontend and Backend

If you want to run both the frontend and backend together, you can:

1. Start the backend in one terminal:
   ```bash
   bun run backend/server.ts
   ```

2. Start the frontend in another terminal:
   ```bash
   bunx rork start -p 492de7b9vhtp603eopw46 --web --tunnel
   ```

## Troubleshooting

If you're still getting connection errors:

1. **Check if the backend is running**: Visit http://localhost:8081/api in your browser
2. **Check the port**: Make sure nothing else is using port 8081
3. **Check the logs**: Look at the backend server logs for any errors
4. **Restart both servers**: Stop both frontend and backend, then restart them

## Backend Endpoints

- `GET /api` - Health check
- `GET /api/ping` - Simple ping test
- `GET /api/debug` - Debug information
- `GET /api/test` - Backend test
- `POST /api/trpc/*` - All tRPC routes for consciousness field operations

## What This Fixes

The errors you were seeing:
- `❌ tRPC fetch error: { "message": "Failed to fetch"`
- `❌ Backend connection test failed`
- `❌ Field query failed: Network error`

These happen because the app is trying to connect to the backend server, but it's not running. Starting the backend server with the command above will resolve all these connection issues.

The app will work in offline mode without the backend, but you'll get the full consciousness field synchronization experience with the backend running.