import prisma from '../lib/prisma.js';

export async function getDashboardStats(req, res, next) {
  try {
    const [
      totalAssets,
      availableAssets,
      assignedAssets,
      returnRequestedAssets,
      inRepairAssets,
      retiredAssets,
      softwareLicenses,
      activeLicenseAllocations,
      totalEmployees,
      recentActivities,
      categoryCounts
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      prisma.asset.count({ where: { status: 'ASSIGNED' } }),
      prisma.asset.count({ where: { status: 'RETURN_REQUESTED' } }),
      prisma.asset.count({ where: { status: 'IN_REPAIR' } }),
      prisma.asset.count({ where: { status: 'RETIRED' } }),
      prisma.asset.count({ where: { category: 'SOFTWARE_LICENSE' } }),
      prisma.licenseAllocation.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.count(),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      }),
      prisma.asset.groupBy({
        by: ['category'],
        _count: { id: true }
      })
    ]);

    res.json({
      stats: {
        totalAssets,
        availableAssets,
        assignedAssets,
        returnRequestedAssets,
        inRepairAssets,
        retiredAssets,
        softwareLicenses,
        activeLicenseAllocations,
        totalEmployees
      },
      categoryBreakdown: categoryCounts.reduce((acc, curr) => {
        acc[curr.category] = curr._count.id;
        return acc;
      }, {}),
      recentActivities
    });
  } catch (error) {
    next(error);
  }
}

export async function getNotifications(req, res, next) {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [
      pendingReturns,
      assetsInRepair,
      expiringLicenses,
      recentAudits
    ] = await Promise.all([
      prisma.returnRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { requestedAt: 'desc' },
        take: 5,
        include: { asset: true, employee: true }
      }),
      prisma.asset.findMany({
        where: { status: 'IN_REPAIR' },
        orderBy: { updatedAt: 'desc' },
        take: 5
      }),
      prisma.asset.findMany({
        where: {
          category: 'SOFTWARE_LICENSE',
          expirationDate: {
            lte: thirtyDaysFromNow
          }
        },
        orderBy: { expirationDate: 'asc' },
        take: 5
      }),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } }
      })
    ]);

    const notifications = [];

    pendingReturns.forEach(ret => {
      notifications.push({
        id: `return-${ret.id}`,
        type: 'RETURN_PENDING',
        title: `Pending Return: ${ret.asset.assetTag}`,
        description: `${ret.employee.name} requested return (${ret.reason || 'No reason specified'})`,
        timestamp: ret.requestedAt,
        priority: 'high',
        link: '/returns'
      });
    });

    assetsInRepair.forEach(asset => {
      notifications.push({
        id: `repair-${asset.id}`,
        type: 'IN_REPAIR',
        title: `Asset in Repair: ${asset.assetTag}`,
        description: `${asset.brand} ${asset.model} currently undergoing maintenance`,
        timestamp: asset.updatedAt,
        priority: 'medium',
        link: '/repairs'
      });
    });

    expiringLicenses.forEach(lic => {
      const isExpired = new Date(lic.expirationDate) < new Date();
      notifications.push({
        id: `license-${lic.id}`,
        type: isExpired ? 'LICENSE_EXPIRED' : 'LICENSE_EXPIRING',
        title: isExpired ? `Expired License: ${lic.brand} ${lic.model}` : `Expiring Soon: ${lic.brand} ${lic.model}`,
        description: isExpired ? 'License validity period has ended.' : `Expires on ${new Date(lic.expirationDate).toLocaleDateString()}`,
        timestamp: lic.expirationDate,
        priority: isExpired ? 'high' : 'low',
        link: '/licenses'
      });
    });

    res.json({
      unreadCount: notifications.length,
      notifications
    });
  } catch (error) {
    next(error);
  }
}
