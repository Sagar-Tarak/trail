export const sdkInstall = `# In the application backend that writes to your company database:
pnpm add ./vendor/triotrail-sdk-0.0.0.tgz pg

# Keep your existing @prisma/client version aligned with your Prisma CLI.
# If the application has no Prisma client yet, set up Prisma first.
pnpm exec prisma generate`;
export const sdkBuild = `# For the developer distributing this repository's SDK:
cd Trio-trail/sdk
pnpm install --frozen-lockfile
pnpm verify
pnpm pack --pack-destination releases
# Share releases/triotrail-sdk-0.0.0.tgz with the application developer.`;
export const sdkPrisma = `// db.ts — use this shared client throughout your application
import { PrismaClient } from "@prisma/client";
import { wrapPrismaWithTriotrail } from "triotrail-sdk";

export const prisma = wrapPrismaWithTriotrail(new PrismaClient(), {
  strictActor: false,
});
// The application's DATABASE_URL points to YOUR source database.
// Install the outbox before running attributed writes.
// Missing actor context is recorded as unavailable and never rejects a write.`;
export const sdkFrameworks = {
  express: {
    label: "Express",
    code: `import type { Request } from "express";
import { expressActorMiddleware } from "triotrail-sdk/adapters/express";

type AuthenticatedRequest = Request & { user?: { id: string | number; name?: string; role?: string } };

// app is your existing Express application.
// Register AFTER authentication populates req.user, BEFORE business routes.
app.use(expressActorMiddleware({
  extractActor: (request) => {
    const req = request as AuthenticatedRequest;
    return req.user ? {
      actorId: String(req.user.id),
      actorType: "user",
      requestId: req.get("x-request-id"),
      context: { displayName: req.user.name, role: req.user.role },
      reason: req.method + " " + req.path,
    } : null;
  },
}));
// Business routes must import the wrapped prisma from db.ts.`,
  },
  nest: {
    label: "NestJS",
    code: `import { TriotrailActorInterceptor } from "triotrail-sdk/adapters/nest";

// In main.ts, on your existing Nest application:
app.useGlobalInterceptors(new TriotrailActorInterceptor((req) =>
  req.user ? {
    actorId: String(req.user.id),
    actorType: "user",
    requestId: req.headers["x-request-id"],
    reason: req.method + " " + req.url,
  } : null,
));
// Authentication guards must populate req.user before this interceptor runs.
// Provide the wrapped Prisma client through your Prisma service/provider.
// The adapter requires @nestjs/common and rxjs in the application.`,
  },
  fastify: {
    label: "Fastify",
    code: `import type { FastifyRequest } from "fastify";
import { fastifyActorPlugin } from "triotrail-sdk/adapters/fastify";

type AuthenticatedRequest = FastifyRequest & { user?: { id: string | number; name?: string; role?: string } };

// Attach the hook directly to the scope that owns your business routes.
// Authentication must populate req.user BEFORE this preHandler hook.
fastifyActorPlugin(app, {
  extractActor: (request) => {
    const req = request as AuthenticatedRequest;
    return req.user ? {
      actorId: String(req.user.id),
      actorType: "user",
      requestId: req.id,
      context: { displayName: req.user.name, role: req.user.role },
      reason: req.method + " " + req.url,
    } : null;
  },
}, () => {});
// Use the wrapped prisma in the routes that make database changes.`,
  },
};
export const sdkTransaction = `import { withActor } from "triotrail-sdk";
import { prisma } from "./db.js";

// Replace Order / orderItem and their fields with your own Prisma models.
// actorId must come from your authenticated user, not request-body input.
await withActor({
  actorId: authenticatedUserId,
  actorType: "user",
  requestId: requestId,
  reason: "createOrder",
}, async () => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({ data: { status: "DRAFT" } });
    await tx.orderItem.create({ data: { orderId: order.id, quantity: 1 } });
    return order;
  });
});`;
export const sdkJobs = `import { cronJob, backgroundJob } from "triotrail-sdk";
import { prisma } from "./db.js";

// Example model and fields: adapt to your application schema.
export const expireOrders = cronJob("expire-orders", async () => {
  await prisma.$transaction((tx) => tx.order.updateMany({
    where: { status: "EXPIRED_PENDING" },
    data: { status: "EXPIRED" },
  }));
});
// Register expireOrders with your existing scheduler.
// Actor: cron:expire-orders, type: cron.

export const processQueueItem = backgroundJob("order-worker", async () => {
  // Use prisma.$transaction(async (tx) => ...) for attributed worker writes.
});
// Register processQueueItem with your existing queue consumer.
// Actor: cron:order-worker, type: service (current SDK naming).`;
