import prisma from '../lib/prisma.js';
import { validateStateTransition, getAvailableTransitions } from '../services/stateMachine.js';
import { logAudit } from '../services/auditService.js';

export async function getAssets(req, res, next) {
  try {
    const {
      search,
      category,
      status,
      employeeId,
      department,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (employeeId && employeeId !== 'ALL') {
      where.custodyRecords = {
        some: {
          employeeId: employeeId,
          checkinDate: null
        }
      };
    }

    if (department && department !== 'ALL') {
      where.custodyRecords = {
        some: {
          checkinDate: null,
          employee: {
            department: department
          }
        }
      };
    }

    if (search && search.trim() !== '') {
      const s = search.trim();
      where.OR = [
        { assetTag: { contains: s, mode: 'insensitive' } },
        { brand: { contains: s, mode: 'insensitive' } },
        { model: { contains: s, mode: 'insensitive' } },
        { serialNumber: { contains: s, mode: 'insensitive' } },
        { location: { contains: s, mode: 'insensitive' } },
        {
          custodyRecords: {
            some: {
              checkinDate: null,
              employee: {
                OR: [
                  { name: { contains: s, mode: 'insensitive' } },
                  { department: { contains: s, mode: 'insensitive' } },
                  { employeeId: { contains: s, mode: 'insensitive' } }
                ]
              }
            }
          }
        }
      ];
    }

    const [total, assets] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc' },
        include: {
          custodyRecords: {
            where: { checkinDate: null },
            include: {
              employee: {
                select: { id: true, name: true, employeeId: true, department: true, email: true }
              }
            },
            take: 1
          },
          licenseAllocations: {
            where: { status: 'ACTIVE' },
            include: {
              employee: {
                select: { id: true, name: true, employeeId: true, department: true }
              }
            }
          }
        }
      })
    ]);

    // Format output with current assignee & license seat usage
    const formattedAssets = assets.map(asset => {
      const currentCustody = asset.custodyRecords?.[0] || null;
      const activeAllocationsCount = asset.licenseAllocations?.length || 0;
      return {
        ...asset,
        currentEmployee: currentCustody ? currentCustody.employee : null,
        currentCustody: currentCustody,
        activeSeatsAllocated: activeAllocationsCount,
        availableTransitions: getAvailableTransitions(asset.status)
      };
    });

    res.json({
      data: formattedAssets,
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

export async function getAssetById(req, res, next) {
  try {
    const { id } = req.params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        custodyRecords: {
          orderBy: { checkoutDate: 'desc' },
          include: {
            employee: true
          }
        },
        serviceRecords: {
          orderBy: { serviceDate: 'desc' }
        },
        returnRequests: {
          orderBy: { requestedAt: 'desc' },
          include: {
            employee: true
          }
        },
        licenseAllocations: {
          orderBy: { allocatedAt: 'desc' },
          include: {
            employee: true
          }
        }
      }
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    // Fetch relevant audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityId: id },
          { details: { contains: asset.assetTag, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    const activeCustody = asset.custodyRecords.find(c => c.checkinDate === null) || null;
    const activeAllocations = asset.licenseAllocations.filter(l => l.status === 'ACTIVE');

    res.json({
      ...asset,
      currentCustody: activeCustody,
      currentEmployee: activeCustody ? activeCustody.employee : null,
      activeAllocations,
      activeSeatsAllocated: activeAllocations.length,
      availableTransitions: getAvailableTransitions(asset.status),
      auditLogs
    });
  } catch (error) {
    next(error);
  }
}

export async function createAsset(req, res, next) {
  try {
    const {
      assetTag,
      category,
      brand,
      model,
      serialNumber,
      purchaseDate,
      purchaseCost,
      location,
      notes,
      licenseKey,
      seatQuota,
      costPerSeat,
      expirationDate
    } = req.body;

    if (!assetTag || !assetTag.trim()) {
      return res.status(400).json({ message: 'Asset tag is required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ message: 'Category is required.' });
    }
    if (!brand || !brand.trim()) {
      return res.status(400).json({ message: 'Brand is required.' });
    }
    if (!model || !model.trim()) {
      return res.status(400).json({ message: 'Model is required.' });
    }

    // Check duplicate asset tag
    const existingTag = await prisma.asset.findUnique({
      where: { assetTag: assetTag.trim().toUpperCase() }
    });
    if (existingTag) {
      return res.status(409).json({ message: `Asset tag ${assetTag.trim().toUpperCase()} already exists.` });
    }

    // Check duplicate serial number if provided
    if (serialNumber && serialNumber.trim()) {
      const existingSerial = await prisma.asset.findUnique({
        where: { serialNumber: serialNumber.trim() }
      });
      if (existingSerial) {
        return res.status(409).json({ message: `Serial number ${serialNumber.trim()} already exists.` });
      }
    }

    const newAsset = await prisma.asset.create({
      data: {
        assetTag: assetTag.trim().toUpperCase(),
        category: category.trim().toUpperCase(),
        brand: brand.trim(),
        model: model.trim(),
        serialNumber: serialNumber?.trim() || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseCost: purchaseCost ? parseFloat(purchaseCost) : 0,
        location: location?.trim() || 'HQ Floor 1',
        status: 'AVAILABLE',
        notes: notes?.trim() || null,
        licenseKey: licenseKey?.trim() || null,
        seatQuota: seatQuota ? parseInt(seatQuota, 10) : 0,
        costPerSeat: costPerSeat ? parseFloat(costPerSeat) : 0,
        expirationDate: expirationDate ? new Date(expirationDate) : null
      }
    });

    await logAudit({
      action: 'ASSET_CREATED',
      entityType: 'ASSET',
      entityId: newAsset.id,
      details: `Created ${newAsset.category} asset [${newAsset.assetTag}] ${newAsset.brand} ${newAsset.model}`,
      performedBy: req.user.id
    });

    res.status(201).json({
      message: 'Asset created successfully.',
      asset: newAsset
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAsset(req, res, next) {
  try {
    const { id } = req.params;
    const {
      brand,
      model,
      serialNumber,
      purchaseDate,
      purchaseCost,
      location,
      notes,
      licenseKey,
      seatQuota,
      costPerSeat,
      expirationDate,
      status
    } = req.body;

    const existingAsset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!existingAsset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    // If status change is attempted, validate through deterministic state machine
    if (status && status !== existingAsset.status) {
      const validation = validateStateTransition(existingAsset.status, status);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }
    }

    // If serial number is changed, check uniqueness
    if (serialNumber && serialNumber.trim() !== existingAsset.serialNumber) {
      const existingSerial = await prisma.asset.findUnique({
        where: { serialNumber: serialNumber.trim() }
      });
      if (existingSerial && existingSerial.id !== id) {
        return res.status(409).json({ message: `Serial number ${serialNumber.trim()} already exists.` });
      }
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        brand: brand !== undefined ? brand.trim() : existingAsset.brand,
        model: model !== undefined ? model.trim() : existingAsset.model,
        serialNumber: serialNumber !== undefined ? (serialNumber?.trim() || null) : existingAsset.serialNumber,
        purchaseDate: purchaseDate !== undefined ? (purchaseDate ? new Date(purchaseDate) : null) : existingAsset.purchaseDate,
        purchaseCost: purchaseCost !== undefined ? (purchaseCost ? parseFloat(purchaseCost) : 0) : existingAsset.purchaseCost,
        location: location !== undefined ? location.trim() : existingAsset.location,
        notes: notes !== undefined ? notes?.trim() : existingAsset.notes,
        status: status || existingAsset.status,
        licenseKey: licenseKey !== undefined ? (licenseKey?.trim() || null) : existingAsset.licenseKey,
        seatQuota: seatQuota !== undefined ? (seatQuota ? parseInt(seatQuota, 10) : 0) : existingAsset.seatQuota,
        costPerSeat: costPerSeat !== undefined ? (costPerSeat ? parseFloat(costPerSeat) : 0) : existingAsset.costPerSeat,
        expirationDate: expirationDate !== undefined ? (expirationDate ? new Date(expirationDate) : null) : existingAsset.expirationDate
      }
    });

    await logAudit({
      action: 'ASSET_UPDATED',
      entityType: 'ASSET',
      entityId: updated.id,
      details: `Updated asset [${updated.assetTag}] (${updated.brand} ${updated.model})`,
      performedBy: req.user.id
    });

    res.json({
      message: 'Asset updated successfully.',
      asset: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function transitionAssetStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { nextStatus, reason } = req.body;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        custodyRecords: { where: { checkinDate: null } }
      }
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    const validation = validateStateTransition(asset.status, nextStatus);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    // Handle retirement transition
    if (nextStatus === 'RETIRED') {
      // Check in active custody if any
      if (asset.custodyRecords?.length > 0) {
        await prisma.custodyRecord.updateMany({
          where: { assetId: id, checkinDate: null },
          data: {
            checkinDate: new Date(),
            conditionReturn: 'RETIRED',
            notes: reason || 'Asset retired from service.'
          }
        });
      }
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: { status: nextStatus }
    });

    await logAudit({
      action: nextStatus === 'RETIRED' ? 'ASSET_RETIRED' : `STATUS_CHANGED_TO_${nextStatus}`,
      entityType: 'ASSET',
      entityId: updated.id,
      details: `Asset [${updated.assetTag}] transitioned from ${asset.status} to ${nextStatus}. ${reason ? `Reason: ${reason}` : ''}`,
      performedBy: req.user.id
    });

    res.json({
      message: `Asset status successfully transitioned to ${nextStatus}.`,
      asset: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAsset(req, res, next) {
  try {
    const { id } = req.params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        custodyRecords: { where: { checkinDate: null } }
      }
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    if (asset.status === 'ASSIGNED' || asset.custodyRecords.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete asset while it is actively assigned to an employee. Check it in or resolve custody first.'
      });
    }

    await prisma.asset.delete({
      where: { id }
    });

    await logAudit({
      action: 'ASSET_DELETED',
      entityType: 'ASSET',
      entityId: id,
      details: `Deleted asset [${asset.assetTag}] ${asset.brand} ${asset.model}`,
      performedBy: req.user.id
    });

    res.json({
      message: `Asset ${asset.assetTag} deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}
