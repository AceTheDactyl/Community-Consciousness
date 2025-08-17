import { createTRPCRouter, publicProcedure } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import consciousnessSyncRoute from "./routes/consciousness/sync/route";
import consciousnessFieldRoute from "./routes/consciousness/field/route";
import consciousnessRealtimeRoute from "./routes/consciousness/realtime/route";
import consciousnessEntanglementRoute from "./routes/consciousness/entanglement/route";
import consciousnessRoom64Route from "./routes/consciousness/room64/route";
import consciousnessArchaeologyRoute from "./routes/consciousness/archaeology/route";

export const appRouter = createTRPCRouter({
  // Simple health check endpoint
  health: publicProcedure.query(() => {
    console.log('🏥 Health check endpoint called');
    return {
      status: 'ok',
      message: 'tRPC server is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      routes: {
        example: 'available',
        consciousness: 'available'
      }
    };
  }),
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  consciousness: createTRPCRouter({
    sync: consciousnessSyncRoute,
    field: consciousnessFieldRoute,
    realtime: consciousnessRealtimeRoute,
    entanglement: consciousnessEntanglementRoute,
    room64: consciousnessRoom64Route,
    archaeology: consciousnessArchaeologyRoute,
  }),
});

export type AppRouter = typeof appRouter;