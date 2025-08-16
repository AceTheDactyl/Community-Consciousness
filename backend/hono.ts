import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { wsManager } from "./websocket-manager";

// app will be mounted at /api
const app = new Hono();

// Enable CORS for all routes
app.use("*", cors());

// WebSocket upgrade endpoint
app.get("/ws", (c) => {
  const upgrade = c.req.header("upgrade");
  if (upgrade !== "websocket") {
    return c.text("Expected websocket", 400);
  }
  
  // This would be handled by the WebSocket server in a real implementation
  // For now, return instructions for WebSocket connection
  return c.json({
    message: "WebSocket endpoint - connect with ws:// protocol",
    endpoint: "/api/ws",
    protocols: ["consciousness-sync"]
  });
});

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

// Simple health check endpoint
app.get("/", (c) => {
  const stats = wsManager.getStats();
  return c.json({ 
    status: "ok", 
    message: "Consciousness Field API is running",
    websocket: {
      endpoint: "/api/ws",
      ...stats
    }
  });
});

export default app;