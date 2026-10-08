import { PrismaClient, AuditAction, Prisma } from '@prisma/client';
import type { FastifyBaseLogger } from 'fastify';

export interface CreateAuditLogParams {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates an audit log entry for a project or task mutation.
 *
 * Designed to be called **fire-and-forget** (without await) from route handlers
 * so that an audit write failure never propagates to the user response.
 * Errors are logged via Pino but do not throw.
 *
 * @example
 *   // Inside a route handler — no await, non-blocking
 *   createAuditLog(fastify.prisma, {
 *     userId: req.user!.id,
 *     action: AuditAction.PROJECT_CREATED,
 *     entityType: 'PROJECT',
 *     entityId: project.id,
 *     metadata: { name: project.name },
 *   }, req.log).catch(() => {});
 */
export async function createAuditLog(
  prisma: PrismaClient,
  params: CreateAuditLogParams,
  logger?: FastifyBaseLogger,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata
          ? (params.metadata as Prisma.InputJsonValue)
          : undefined,
      },
    });
  } catch (error) {
    logger?.error({ error, params }, 'Failed to create audit log entry');
  }
}