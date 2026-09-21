import prisma from '../lib/prisma.js';
import { validateStateTransition } from '../services/stateMachine.js';
import { logAudit } from '../services/auditService.js';

export async function createAssignment(req, res, next) {
  try {
    const { assetId, employeeId, conditionCheckout = 'GOOD', notes } = req.body;

    if (!assetId) {
      return res.status(400).json({ message: 'Asset selection is required.' });
    }
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee selection is required.' });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });
    if (!employee) {
  return res.status(404).json({ message: 'Employee not found.' });
}

// Prevent multiple active assignments for the same asset
const activeCustody = await prisma.custodyRecord.findFirst({
  where: {
    assetId,
    checkinDate: null
  }
});

if (activeCustody) {
  return res.status(400).json({
    message: 'Cannot assign asset. It is already assigned to an employee.'
  });
}

// State machine check
const transitionCheck = validateStateTransition(asset.status, 'ASSIGNED');
    if (!transitionCheck.valid) {
      return res.status(400).json({
        message: `Cannot assign asset. ${transitionCheck.error}`
      });
    }

    // Create immutable custody record and update asset state atomically in a transaction
    const [custodyRecord, updatedAsset] = await prisma.$transaction([
      prisma.custodyRecord.create({
        data: {
          assetId,
          employeeId,
          checkoutDate: new Date(),
          conditionCheckout,
          notes: notes?.trim() || null
        },
        include: {
          asset: true,
          employee: true
        }
      }),
      prisma.asset.update({
        where: { id: assetId },
        data: { status: 'ASSIGNED' }
      })
    ]);

    await logAudit({
      action: 'ASSET_ASSIGNED',
      entityType: 'CUSTODY',
      entityId: custodyRecord.id,
      details: `Asset [${asset.assetTag}] assigned to ${employee.name} (${employee.employeeId}). Condition: ${conditionCheckout}`,
      performedBy: req.user.id
    });

    res.status(201).json({
      message: 'Asset assigned successfully.',
      custodyRecord,
      asset: updatedAsset
    });
  } catch (error) {
    next(error);
  }
}

export async function getCustodyRecords(req, res, next) {
  try {
    const { assetId, employeeId, activeOnly, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (assetId) where.assetId = assetId;
    if (employeeId) where.employeeId = employeeId;
    if (activeOnly === 'true') where.checkinDate = null;

    const [total, records] = await Promise.all([
      prisma.custodyRecord.count({ where }),
      prisma.custodyRecord.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { checkoutDate: 'desc' },
        include: {
          asset: true,
          employee: true
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
