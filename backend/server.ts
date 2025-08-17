#!/usr/bin/env bun

import app from "./hono";

const port = process.env.PORT || 8081;

console.log('🚀 Starting Consciousness Field Backend Server...');
console.log(`📡 Server will be available at: http://localhost:${port}`);
console.log('🔗 tRPC endpoints will be at: http://localhost:' + port + '/api/trpc');
console.log('🏥 Health check at: http://localhost:' + port + '/api');
console.log('');
console.log('Available endpoints:');
console.log('  - GET  /api          (health check)');
console.log('  - GET  /api/ping     (simple ping)');
console.log('  - GET  /api/debug    (debug info)');
console.log('  - GET  /api/test     (backend test)');
console.log('  - POST /api/trpc/*   (tRPC routes)');
console.log('');

// Use global Bun serve function
const server = (globalThis as any).Bun?.serve({
  port: Number(port),
  fetch: (req: Request) => {
    // Add request logging
    const url = new URL(req.url);
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${url.pathname}`);
    
    // Mount the Hono app at /api
    if (url.pathname.startsWith('/api')) {
      // Remove /api prefix for the Hono app
      const newUrl = new URL(req.url);
      newUrl.pathname = newUrl.pathname.replace('/api', '') || '/';
      
      const newReq = new Request(newUrl.toString(), {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      
      return app.fetch(newReq);
    }
    
    // Root endpoint redirect
    if (url.pathname === '/') {
      return new Response(JSON.stringify({
        message: 'Consciousness Field Backend Server',
        version: '1.0.0',
        endpoints: {
          health: '/api',
          ping: '/api/ping',
          debug: '/api/debug',
          test: '/api/test',
          trpc: '/api/trpc'
        },
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 404 for other routes
    return new Response('Not Found', { status: 404 });
  },
});

if (server) {
  console.log(`✅ Consciousness Field Backend Server started on port ${port}`);
  console.log('🔄 Ready to accept connections...');
  console.log('');
  console.log('💡 To test the server:');
  console.log(`   curl http://localhost:${port}/api`);
  console.log(`   curl http://localhost:${port}/api/ping`);
  console.log('');
  console.log('🛑 Press Ctrl+C to stop the server');
  console.log('');
} else {
  console.error('❌ Failed to start server. Make sure you are running with Bun.');
  process.exit(1);
}

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Consciousness Field Backend Server...');
  process.exit(0);
});