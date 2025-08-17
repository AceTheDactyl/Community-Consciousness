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
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control', 'X-Requested-With'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']
}));

// Log all requests for debugging
app.use("*", async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const origin = c.req.header('origin') || 'unknown';
  const userAgent = c.req.header('user-agent') || 'unknown';
  
  console.log(`📡 ${method} ${path} from ${origin}`);
  console.log(`   User-Agent: ${userAgent.substring(0, 50)}...`);
  
  // Log request headers for tRPC requests
  if (path.includes('/trpc/')) {
    console.log('   tRPC Headers:', {
      'content-type': c.req.header('content-type'),
      'accept': c.req.header('accept'),
      'cache-control': c.req.header('cache-control')
    });
  }
  
  try {
    await next();
    
    const duration = Date.now() - start;
    const status = c.res.status;
    console.log(`✅ ${method} ${path} completed in ${duration}ms (status: ${status})`);
    
    // Log response headers for failed requests
    if (status >= 400) {
      console.log('   Response Headers:', {
        'content-type': c.res.headers.get('content-type'),
        'access-control-allow-origin': c.res.headers.get('access-control-allow-origin')
      });
    }
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ ${method} ${path} failed in ${duration}ms:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 300) : 'No stack'
    });
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
        stack: error.stack?.substring(0, 500),
        input: input ? JSON.stringify(input).substring(0, 200) : 'none',
        timestamp: new Date().toISOString()
      });
    },
  })
);

// Add explicit OPTIONS handler for tRPC routes
app.options("/trpc/*", (c) => {
  console.log('📋 OPTIONS request for tRPC route:', c.req.url);
  return c.text('', 200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Cache-Control, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  });
});

// Simple health check endpoint
app.get("/", (c) => {
  try {
    console.log('🏥 Health check endpoint called');
    
    // Basic health check without websocket dependency
    const response: any = { 
      status: "ok", 
      message: "Consciousness Field API is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      server: "Hono v4.9.1",
      endpoints: {
        health: "/api",
        ping: "/api/ping",
        debug: "/api/debug",
        test: "/api/test",
        trpc: "/api/trpc",
        websocket: "/api/ws"
      },
      cors: {
        enabled: true,
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']
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
    
    console.log('✅ Health check response generated');
    return c.json(response);
  } catch (error) {
    console.error('❌ Health check error:', error);
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
        contentType: c.req.header('content-type') || 'none',
        host: c.req.header('host') || 'none',
        referer: c.req.header('referer') || 'none'
      },
      request: {
        method: c.req.method,
        url: c.req.url,
        path: c.req.path
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

// Add a simple ping endpoint for basic connectivity testing
app.get("/ping", (c) => {
  console.log('🏓 Ping endpoint called from:', c.req.header('origin') || 'unknown');
  return c.json({ 
    message: 'pong', 
    timestamp: new Date().toISOString(),
    server: 'Hono backend'
  });
});

export default app;