import prisma from '../lib/prisma.js';
import { logAudit } from '../services/auditService.js';

export async function getSoftwareLicenses(req, res, next) {
  try {
    const { search, page = 1, limit = 15 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      category: 'SOFTWARE_LICENSE'
    };

    if (search && search.trim() !== '') {
      const s = search.trim();
      where.OR = [
        { brand: { contains: s, mode: 'insensitive' } },
        { model: { contains: s, mode: 'insensitive' } },
        { assetTag: { contains: s, mode: 'insensitive' } },
        { licenseKey: { contains: s, mode: 'insensitive' } }
      ];
    }

    const [total, licenses] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          licenseAllocations: {
            where: { status: 'ACTIVE' },
            include: {
              employee: true
            }
          }
        }
      })
    ]);

    const formatted = licenses.map(lic => {
      const allocatedSeats = lic.licenseAllocations.length;
      const totalSeats = lic.seatQuota || 0;
      const availableSeats = Math.max(0, totalSeats - allocatedSeats);
      const isExpiringSoon = lic.expirationDate ? (new Date(lic.expirationDate) - new Date()) / (1000 * 60 * 60 * 24) <= 30 : false;
      const isExpired = lic.expirationDate ? new Date(lic.expirationDate) < new Date() : false;

      return {
        ...lic,
        allocatedSeats,
        availableSeats,
        isExpiringSoon,
        isExpired,
        activeAllocations: lic.licenseAllocations
      };
    });

    res.json({
      data: formatted,
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

export async function allocateLicenseSeat(req, res, next) {
  try {
    const { assetId, employeeId, notes } = req.body;

    if (!assetId) {
      return res.status(400).json({ message: 'Software license ID is required.' });
    }
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID is required.' });
    }

    const license = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        licenseAllocations: { where: { status: 'ACTIVE' } }
      }
    });

    if (!license || license.category !== 'SOFTWARE_LICENSE') {
      return res.status(404).json({ message: 'Software license not found.' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // Check quota
    const currentActiveCount = license.licenseAllocations.length;
    if (license.seatQuota > 0 && currentActiveCount >= license.seatQuota) {
      return res.status(400).json({
        message: `License seat limit reached. All ${license.seatQuota} seats are currently in use.`
      });
    }

    // Check duplicate active allocation
    const existingAllocation = license.licenseAllocations.find(a => a.employeeId === employeeId);
    if (existingAllocation) {
      return res.status(400).json({
        message: `${employee.name} is already assigned an active seat for this license.`
      });
    }

    const allocation = await prisma.licenseAllocation.create({
      data: {
        assetId,
        employeeId,
        allocatedAt: new Date(),
        status: 'ACTIVE',
        notes: notes?.trim() || null
      },
      include: {
        asset: true,
        employee: true
      }
    });

    await logAudit({
      action: 'LICENSE_ALLOCATED',
      entityType: 'LICENSE',
      entityId: allocation.id,
      details: `License seat for [${license.brand} ${license.model}] allocated to ${employee.name} (${employee.employeeId})`,
      performedBy: req.user.id
    });

    res.status(201).json({
      message: 'License allocated successfully.',
      allocation
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeLicenseSeat(req, res, next) {
  try {
    const { id } = req.params;

    const allocation = await prisma.licenseAllocation.findUnique({
      where: { id },
      include: { asset: true, employee: true }
    });

    if (!allocation) {
      return res.status(404).json({ message: 'License allocation not found.' });
    }

    if (allocation.status === 'REVOKED') {
      return res.status(400).json({ message: 'This license seat is already revoked.' });
    }

    const updated = await prisma.licenseAllocation.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date()
      }
    });

    await logAudit({
      action: 'LICENSE_REVOKED',
      entityType: 'LICENSE',
      entityId: id,
      details: `Revoked seat for [${allocation.asset.brand} ${allocation.asset.model}] from ${allocation.employee.name}`,
      performedBy: req.user.id
    });

    res.json({
      message: 'License seat revoked successfully.',
      allocation: updated
    });
  } catch (error) {
    next(error);
  }
}
