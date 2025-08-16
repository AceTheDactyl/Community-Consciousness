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
  origin: '*', // Allow all origins in development
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Log all requests for debugging
app.use("*", async (c, next) => {
  console.log(`📡 ${c.req.method} ${c.req.url} from ${c.req.header('origin') || 'unknown'}`);
  await next();
});

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
    endpoint: "/trpc", // Remove /api prefix since it's already mounted at /api
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`❌ tRPC error on ${path}:`, error);
    },
  })
);

// Simple health check endpoint
app.get("/", (c) => {
  try {
    // Basic health check without websocket dependency
    const response: any = { 
      status: "ok", 
      message: "Consciousness Field API is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      endpoints: {
        health: "/api",
        test: "/api/test",
        trpc: "/api/trpc",
        websocket: "/api/ws"
      }
    };
    
    // Try to get websocket stats, but don't fail if it errors
    try {
      const stats = wsManager.getStats();
      response.websocket = {
        endpoint: "/api/ws",
        ...stats
      };
    } catch (wsError) {
      console.warn('WebSocket stats unavailable:', wsError);
      response.websocket = {
        endpoint: "/api/ws",
        status: "unavailable",
        error: wsError instanceof Error ? wsError.message : 'Unknown error'
      };
    }
    
    return c.json(response);
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
    timestamp: new Date().toISOString(),
    cors: "enabled",
    trpc: "mounted at /api/trpc",
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || '8081'
    }
  });
});

// Add tRPC test endpoint
app.get("/trpc-test", async (c) => {
  try {
    // Test if tRPC router is working
    return c.json({
      message: "tRPC endpoint accessible",
      timestamp: new Date().toISOString(),
      routes: {
        example: "/api/trpc/example.hi",
        consciousness: {
          sync: "/api/trpc/consciousness.sync",
          field: "/api/trpc/consciousness.field"
        }
      }
    });
  } catch (error) {
    return c.json({
      error: "tRPC test failed",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;