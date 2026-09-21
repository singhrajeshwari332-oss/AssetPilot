import prisma from '../lib/prisma.js';
import { validateStateTransition } from '../services/stateMachine.js';
import { logAudit } from '../services/auditService.js';

export async function getReturnRequests(req, res, next) {
  try {
    const { status, page = 1, limit = 15 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [total, requests] = await Promise.all([
      prisma.returnRequest.count({ where }),

      prisma.returnRequest.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { requestedAt: 'desc' },
        include: {
          asset: true,
          employee: true
        }
      })
    ]);

    res.json({
      data: requests,
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

export async function createReturnRequest(req, res, next) {
  try {
    const {
      assetId,
      employeeId,
      reason,
      conditionNotes
    } = req.body;

    if (!assetId) {
      return res.status(400).json({
        message: 'Asset ID is required.'
      });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        custodyRecords: {
          where: { checkinDate: null },
          include: { employee: true }
        }
      }
    });

    if (!asset) {
      return res.status(404).json({
        message: 'Asset not found.'
      });
    }

    // Find the employee who currently holds the asset
    const currentCustody = asset.custodyRecords[0];

    if (!currentCustody) {
      return res.status(400).json({
        message: 'Asset is not currently assigned to an employee.'
      });
    }

    // If employeeId is supplied, it MUST match the current holder
    if (employeeId && employeeId !== currentCustody.employeeId) {
      return res.status(400).json({
        message: 'Return request can only be created by the employee currently holding the asset.'
      });
    }

    // If employeeId was not supplied, use the current holder
    const targetEmployeeId = employeeId || currentCustody.employeeId;

    // Verify the asset can move to RETURN_REQUESTED
    const transitionCheck = validateStateTransition(
      asset.status,
      'RETURN_REQUESTED'
    );

    if (!transitionCheck.valid) {
      return res.status(400).json({
        message: transitionCheck.error
      });
    }

    // Prevent duplicate pending return requests
    const existingPendingRequest = await prisma.returnRequest.findFirst({
      where: {
        assetId,
        status: 'PENDING'
      }
    });

    if (existingPendingRequest) {
      return res.status(400).json({
        message: 'A pending return request already exists for this asset.'
      });
    }

    const [returnRequest, updatedAsset] = await prisma.$transaction([
      prisma.returnRequest.create({
        data: {
          assetId,
          employeeId: targetEmployeeId,
          reason: reason?.trim() || null,
          conditionNotes: conditionNotes?.trim() || null,
          status: 'PENDING'
        },
        include: {
          asset: true,
          employee: true
        }
      }),

      prisma.asset.update({
        where: { id: assetId },
        data: {
          status: 'RETURN_REQUESTED'
        }
      })
    ]);

    await logAudit({
      action: 'RETURN_REQUESTED',
      entityType: 'RETURN_REQUEST',
      entityId: returnRequest.id,
      details: `Return requested for asset [${asset.assetTag}] by ${returnRequest.employee.name}. Reason: ${reason || 'N/A'}`,
      performedBy: req.user.id
    });

    res.status(201).json({
      message: 'Return request created successfully.',
      returnRequest,
      asset: updatedAsset
    });
  } catch (error) {
    next(error);
  }
}

export async function processReturnRequest(req, res, next) {
  try {
    const { id } = req.params;

    const {
      conditionReturn = 'GOOD',
      notes,
      nextStatus = 'AVAILABLE'
    } = req.body;

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        asset: true,
        employee: true
      }
    });

    if (!returnRequest) {
      return res.status(404).json({
        message: 'Return request not found.'
      });
    }

    if (returnRequest.status === 'PROCESSED') {
      return res.status(400).json({
        message: 'This return request has already been processed.'
      });
    }

    // Validate state machine transition
    const transitionCheck = validateStateTransition(
      returnRequest.asset.status,
      nextStatus
    );

    if (!transitionCheck.valid) {
      return res.status(400).json({
        message: transitionCheck.error
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find the currently active custody record
      const activeCustody = await tx.custodyRecord.findFirst({
        where: {
          assetId: returnRequest.assetId,
          checkinDate: null
        }
      });

      if (activeCustody) {
        await tx.custodyRecord.update({
          where: {
            id: activeCustody.id
          },
          data: {
            checkinDate: new Date(),
            conditionReturn,
            notes: notes
              ? `${activeCustody.notes ? activeCustody.notes + ' | ' : ''}Checkin: ${notes}`
              : activeCustody.notes
          }
        });
      }

      const updatedRequest = await tx.returnRequest.update({
        where: { id },

        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
          processedNotes: notes?.trim() || null
        }
      });

      const updatedAsset = await tx.asset.update({
        where: { id: returnRequest.assetId },

        data: {
          status: nextStatus
        }
      });

      return {
        updatedRequest,
        updatedAsset
      };
    });

    await logAudit({
      action: 'ASSET_RETURNED',
      entityType: 'RETURN_REQUEST',
      entityId: id,
      details: `Asset [${returnRequest.asset.assetTag}] checked in from ${returnRequest.employee.name}. Return condition: ${conditionReturn}. Target status: ${nextStatus}.`,
      performedBy: req.user.id
    });

    res.json({
      message: 'Return processed and asset checked in successfully.',
      returnRequest: result.updatedRequest,
      asset: result.updatedAsset
    });
  } catch (error) {
    next(error);
  }
}