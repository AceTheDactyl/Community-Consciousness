import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { wsManager } from "./websocket-manager";

// app will be mounted at /api
const app = new Hono();

// Enable CORS for all routes with specific configuration
app.use("*", cors({
  origin: ['http://localhost:8081', 'http://localhost:3000', 'https://*.rork.com'],
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

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
  try {
    const stats = wsManager.getStats();
    return c.json({ 
      status: "ok", 
      message: "Consciousness Field API is running",
      timestamp: new Date().toISOString(),
      websocket: {
        endpoint: "/api/ws",
        ...stats
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return c.json({ 
      status: "error", 
      message: "Health check failed",
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Add a simple test endpoint
app.get("/test", (c) => {
  return c.json({ 
    message: "Backend is working!",
    timestamp: new Date().toISOString()
  });
});

export default app;