import prisma from './prisma';

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  details,
}: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break main functionality
    console.error('[AuditLog] Failed to create audit log:', error);
  }
}
