import prisma from '../lib/prisma.js';

/**
 * Creates an immutable audit log entry.
 * @param {object} param0
 * @param {string} param0.action
 * @param {string} param0.entityType
 * @param {string} [param0.entityId]
 * @param {string|object} [param0.details]
 * @param {string} [param0.performedBy]
 */
export async function logAudit({ action, entityType, entityId, details, performedBy }) {
  try {
    const detailsString = typeof details === 'object' ? JSON.stringify(details) : (details || '');
    return await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        details: detailsString,
        performedBy: performedBy || null
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // Don't crash main operation if audit logging fails
  }
}
