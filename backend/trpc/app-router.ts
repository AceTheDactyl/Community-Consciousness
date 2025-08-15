import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import consciousnessSyncRoute from "./routes/consciousness/sync/route";
import consciousnessFieldRoute from "./routes/consciousness/field/route";
import consciousnessRealtimeRoute from "./routes/consciousness/realtime/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  consciousness: createTRPCRouter({
    sync: consciousnessSyncRoute,
    field: consciousnessFieldRoute,
    realtime: consciousnessRealtimeRoute,
  }),
});

export type AppRouter = typeof appRouter;