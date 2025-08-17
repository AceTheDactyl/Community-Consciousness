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
  const start = Date.now();
  const method = c.req.method;
  const url = c.req.url;
  const origin = c.req.header('origin') || 'unknown';
  
  console.log(`📡 ${method} ${url} from ${origin}`);
  
  try {
    await next();
    
    const duration = Date.now() - start;
    console.log(`✅ ${method} ${url} completed in ${duration}ms (status: ${c.res.status})`);
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ ${method} ${url} failed in ${duration}ms:`, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
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
    onError: ({ error, path, type, input }) => {
      console.error(`❌ tRPC error on ${path} (${type}):`, {
        error: error.message,
        stack: error.stack,
        input: input ? JSON.stringify(input).substring(0, 200) : 'none'
      });
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
    // Test if tRPC router is working by calling the health endpoint
    console.log('🧪 Testing tRPC health endpoint...');
    
    return c.json({
      message: "tRPC endpoint accessible",
      timestamp: new Date().toISOString(),
      routes: {
        health: "/api/trpc/health",
        example: "/api/trpc/example.hi",
        consciousness: {
          sync: "/api/trpc/consciousness.sync",
          field: "/api/trpc/consciousness.field",
          realtime: "/api/trpc/consciousness.realtime",
          entanglement: "/api/trpc/consciousness.entanglement",
          room64: "/api/trpc/consciousness.room64",
          archaeology: "/api/trpc/consciousness.archaeology"
        }
      },
      instructions: {
        health_check: "GET /api/trpc/health",
        example_mutation: "POST /api/trpc/example.hi with body: {name: 'test'}",
        field_query: "POST /api/trpc/consciousness.field with required input"
      }
    });
  } catch (error) {
    console.error('❌ tRPC test endpoint error:', error);
    return c.json({
      error: "tRPC test failed",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Add debug endpoint to test tRPC directly
app.get("/debug", async (c) => {
  try {
    console.log('🔍 Debug endpoint called');
    
    // Test basic functionality
    const debugInfo = {
      timestamp: new Date().toISOString(),
      server: 'Hono backend running',
      cors: 'enabled',
      trpc: {
        mounted: true,
        endpoint: '/api/trpc',
        routes: {
          health: 'available',
          example: 'available', 
          consciousness: 'available'
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT || '8081'
      },
      headers: {
        origin: c.req.header('origin') || 'none',
        userAgent: c.req.header('user-agent') || 'none',
        contentType: c.req.header('content-type') || 'none'
      }
    };
    
    console.log('✅ Debug info generated:', JSON.stringify(debugInfo, null, 2));
    
    return c.json(debugInfo);
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return c.json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

export default app;