import { AppError } from '../errors/AppError';

/**
 * Asserts that the requesting user owns the resource.
 *
 * Throws `AppError(403)` if the resource's owner ID does not match the
 * authenticated user's ID. Call this inside route handlers before performing
 * any mutation or returning sensitive data.
 *
 * @example
 *   // In a future project route:
 *   const project = await fastify.prisma.project.findUniqueOrThrow({ where: { id } });
 *   assertOwnership(project.userId, req.user!.id);
 *
 * @param resourceUserId - The userId stored on the resource (project.userId, task.userId, …)
 * @param requestUserId  - The ID of the currently authenticated user (req.user.id)
 */
export function assertOwnership(
  resourceUserId: string,
  requestUserId: string,
): void {
  if (resourceUserId !== requestUserId) {
    throw new AppError(403, 'Forbidden');
  }
}
