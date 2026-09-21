import prisma from '../lib/prisma.js';
import { validateStateTransition } from '../services/stateMachine.js';
import { logAudit } from '../services/auditService.js';

export async function getServiceRecords(req, res, next) {
  try {
    const { status, assetId, page = 1, limit = 15 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (assetId) {
      where.assetId = assetId;
    }

    const [total, records] = await Promise.all([
      prisma.serviceRecord.count({ where }),
      prisma.serviceRecord.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { serviceDate: 'desc' },
        include: {
          asset: true
        }
      })
    ]);

    res.json({
      data: records,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createServiceRecord(req, res, next) {
  try {
    const { assetId, vendor, issue, cost = 0 } = req.body;

    if (!assetId) {
      return res.status(400).json({ message: 'Asset ID is required.' });
    }
    if (!vendor || !vendor.trim()) {
      return res.status(400).json({ message: 'Service vendor name is required.' });
    }
    if (!issue || !issue.trim()) {
      return res.status(400).json({ message: 'Issue description is required.' });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    const transitionCheck = validateStateTransition(asset.status, 'IN_REPAIR');
    if (!transitionCheck.valid) {
      return res.status(400).json({ message: transitionCheck.error });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Check in active custody if any
      await tx.custodyRecord.updateMany({
        where: { assetId, checkinDate: null },
        data: {
          checkinDate: new Date(),
          conditionReturn: 'NEEDS_REPAIR',
          notes: `Sent to repair: ${issue}`
        }
      });

      const serviceRecord = await tx.serviceRecord.create({
        data: {
          assetId,
          vendor: vendor.trim(),
          issue: issue.trim(),
          cost: parseFloat(cost) || 0,
          serviceDate: new Date(),
          status: 'OPEN'
        },
        include: { asset: true }
      });

      const updatedAsset = await tx.asset.update({
        where: { id: assetId },
        data: { status: 'IN_REPAIR' }
      });

      return { serviceRecord, updatedAsset };
    });

    await logAudit({
      action: 'REPAIR_STARTED',
      entityType: 'SERVICE',
      entityId: result.serviceRecord.id,
      details: `Asset [${asset.assetTag}] sent for repair to vendor ${vendor}. Issue: ${issue}`,
      performedBy: req.user.id
    });

    res.status(201).json({
      message: 'Asset marked for service/repair successfully.',
      serviceRecord: result.serviceRecord,
      asset: result.updatedAsset
    });
  } catch (error) {
    next(error);
  }
}

export async function resolveServiceRecord(req, res, next) {
  try {
    const { id } = req.params;
    const { resolutionNotes, cost, nextStatus = 'AVAILABLE' } = req.body;

    const record = await prisma.serviceRecord.findUnique({
      where: { id },
      include: { asset: true }
    });

    if (!record) {
      return res.status(404).json({ message: 'Service record not found.' });
    }

    if (record.status === 'RESOLVED') {
      return res.status(400).json({ message: 'This service record has already been resolved.' });
    }

    const transitionCheck = validateStateTransition(record.asset.status, nextStatus);
    if (!transitionCheck.valid) {
      return res.status(400).json({ message: transitionCheck.error });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedRecord = await tx.serviceRecord.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolutionNotes: resolutionNotes?.trim() || 'Service completed.',
          cost: cost !== undefined ? (parseFloat(cost) || 0) : record.cost
        }
      });

      const updatedAsset = await tx.asset.update({
        where: { id: record.assetId },
        data: { status: nextStatus }
      });

      return { updatedRecord, updatedAsset };
    });

    await logAudit({
      action: 'REPAIR_RESOLVED',
      entityType: 'SERVICE',
      entityId: id,
      details: `Service resolved for asset [${record.asset.assetTag}]. Resulting status: ${nextStatus}. Notes: ${resolutionNotes || 'Repaired'}`,
      performedBy: req.user.id
    });

    res.json({
      message: `Service resolved successfully. Asset is now ${nextStatus}.`,
      serviceRecord: result.updatedRecord,
      asset: result.updatedAsset
    });
  } catch (error) {
    next(error);
  }
}
