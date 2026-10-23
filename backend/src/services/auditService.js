import { AuditLog } from '../models/AuditLog.js';

export async function logAudit({ actorId, action, modelName, resourceId, details, req }) {
  try {
    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '';
    const userAgent = req?.headers['user-agent'] || '';

    await AuditLog.create({
      actor: actorId,
      action,
      affectedResource: {
        modelName,
        resourceId
      },
      details: details || {},
      ipAddress,
      userAgent
    });
  } catch (err) {
    console.error('[AuditService] Failed to record audit log:', err.message);
  }
}
