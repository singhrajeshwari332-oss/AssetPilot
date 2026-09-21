import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Enterprise Asset Management database...');

  // 1. Clean existing records (in proper foreign-key order)
  await prisma.auditLog.deleteMany();
  await prisma.licenseAllocation.deleteMany();
  await prisma.serviceRecord.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.custodyRecord.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Default User
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      name: 'Sarah Connor',
      passwordHash
    }
  });

  console.log(`Created user: ${adminUser.email} (Password: password123)`);

  // 3. Seed Employees
  const employeesData = [
    {
      employeeId: 'EMP-1001',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@company.com',
      department: 'Engineering',
      designation: 'Senior Fullstack Engineer',
      joinDate: new Date('2023-01-15')
    },
    {
      employeeId: 'EMP-1002',
      name: 'Priya Patel',
      email: 'priya.patel@company.com',
      department: 'Product Design',
      designation: 'Lead UI/UX Designer',
      joinDate: new Date('2023-03-01')
    },
    {
      employeeId: 'EMP-1003',
      name: 'Amit Verma',
      email: 'amit.verma@company.com',
      department: 'DevOps & Infra',
      designation: 'Site Reliability Engineer',
      joinDate: new Date('2023-06-10')
    },
    {
      employeeId: 'EMP-1004',
      name: 'Sneha Reddy',
      email: 'sneha.reddy@company.com',
      department: 'Human Resources',
      designation: 'HR Business Partner',
      joinDate: new Date('2022-11-20')
    },
    {
      employeeId: 'EMP-1005',
      name: 'David Miller',
      email: 'david.miller@company.com',
      department: 'Product Management',
      designation: 'Principal Product Manager',
      joinDate: new Date('2023-08-05')
    },
    {
      employeeId: 'EMP-1006',
      name: 'Ananya Gupta',
      email: 'ananya.gupta@company.com',
      department: 'Engineering',
      designation: 'Frontend Engineer II',
      joinDate: new Date('2024-02-01')
    }
  ];

  const employees = {};
  for (const emp of employeesData) {
    const created = await prisma.employee.create({ data: emp });
    employees[emp.employeeId] = created;
  }
  console.log(`Created ${Object.keys(employees).length} employees.`);

  // 4. Seed Assets
  const assetsData = [
    // Laptops
    {
      assetTag: 'LAP-001',
      category: 'LAPTOP',
      brand: 'Apple',
      model: 'MacBook Pro 16" M3 Max (36GB/1TB)',
      serialNumber: 'C02G80XQMD6R',
      purchaseDate: new Date('2024-01-10'),
      purchaseCost: 289900,
      location: 'Floor 3 - Engineering Bay',
      status: 'ASSIGNED',
      notes: 'Assigned for core engineering builds'
    },
    {
      assetTag: 'LAP-002',
      category: 'LAPTOP',
      brand: 'Apple',
      model: 'MacBook Pro 14" M3 Pro (18GB/512GB)',
      serialNumber: 'C02H11AQMD7S',
      purchaseDate: new Date('2024-02-15'),
      purchaseCost: 199900,
      location: 'Floor 3 - Design Studio',
      status: 'ASSIGNED',
      notes: 'Assigned for UI/UX wireframing & prototyping'
    },
    {
      assetTag: 'LAP-003',
      category: 'LAPTOP',
      brand: 'Lenovo',
      model: 'ThinkPad X1 Carbon Gen 11 (i7/32GB)',
      serialNumber: 'PF3Z89X1',
      purchaseDate: new Date('2023-09-12'),
      purchaseCost: 165000,
      location: 'Floor 2 - Server Ops',
      status: 'IN_REPAIR',
      notes: 'Trackpad unresponsive; sent to Lenovo authorized service center'
    },
    {
      assetTag: 'LAP-004',
      category: 'LAPTOP',
      brand: 'Dell',
      model: 'XPS 15 9530 (i9/32GB/RTX 4060)',
      serialNumber: 'DLXPS9530X1',
      purchaseDate: new Date('2024-03-01'),
      purchaseCost: 220000,
      location: 'HQ IT Storage Locker B',
      status: 'AVAILABLE',
      notes: 'Ready for new engineer onboarding'
    },
    {
      assetTag: 'LAP-005',
      category: 'LAPTOP',
      brand: 'Lenovo',
      model: 'ThinkPad T480 (i5/16GB)',
      serialNumber: 'PF188X88',
      purchaseDate: new Date('2019-05-10'),
      purchaseCost: 85000,
      location: 'Recycle Locker',
      status: 'RETIRED',
      notes: 'Battery swelling and motherboard end-of-life'
    },

    // Monitors
    {
      assetTag: 'MON-001',
      category: 'MONITOR',
      brand: 'Dell',
      model: 'UltraSharp 27" 4K USB-C Hub (U2723QE)',
      serialNumber: 'CN088891DELL4K',
      purchaseDate: new Date('2023-10-05'),
      purchaseCost: 54000,
      location: 'Desk E-14 (Engineering)',
      status: 'ASSIGNED',
      notes: 'Dual monitor setup primary screen'
    },
    {
      assetTag: 'MON-002',
      category: 'MONITOR',
      brand: 'LG',
      model: 'UltraFine 32" Ergo 4K IPS (32UN880)',
      serialNumber: '010NDLK88219',
      purchaseDate: new Date('2023-11-15'),
      purchaseCost: 48000,
      location: 'HQ IT Storage Shelf C',
      status: 'AVAILABLE',
      notes: 'Includes desk clamp arm'
    },
    {
      assetTag: 'MON-003',
      category: 'MONITOR',
      brand: 'Dell',
      model: 'UltraSharp 34" Curved USB-C (U3423WE)',
      serialNumber: 'CN077123DELL34',
      purchaseDate: new Date('2023-04-18'),
      purchaseCost: 78000,
      location: 'Desk D-02 (Design)',
      status: 'RETURN_REQUESTED',
      notes: 'Employee requested return due to remote transition'
    },

    // Mobile Devices
    {
      assetTag: 'MOB-001',
      category: 'MOBILE_DEVICE',
      brand: 'Apple',
      model: 'iPad Pro 12.9" M2 (Wi-Fi 256GB Space Gray)',
      serialNumber: 'DMP89201IPAD',
      purchaseDate: new Date('2023-08-20'),
      purchaseCost: 112000,
      location: 'Design Lab Shelf 1',
      status: 'ASSIGNED',
      notes: 'Includes Apple Pencil 2 for sketching'
    },
    {
      assetTag: 'MOB-002',
      category: 'MOBILE_DEVICE',
      brand: 'Google',
      model: 'Pixel 8 Pro (128GB Obsidian)',
      serialNumber: '3A191FDH3001',
      purchaseDate: new Date('2024-01-05'),
      purchaseCost: 84000,
      location: 'HQ QA Device Lab',
      status: 'AVAILABLE',
      notes: 'Dedicated mobile QA testing device'
    },

    // Peripherals
    {
      assetTag: 'PER-001',
      category: 'PERIPHERAL',
      brand: 'Logitech',
      model: 'MX Master 3S Wireless Mouse + MX Keys Combo',
      serialNumber: 'LOGI2023MX89',
      purchaseDate: new Date('2023-07-10'),
      purchaseCost: 18500,
      location: 'Desk E-14 (Engineering)',
      status: 'ASSIGNED',
      notes: 'Ergonomic workspace accessories'
    },
    {
      assetTag: 'PER-002',
      category: 'PERIPHERAL',
      brand: 'CalDigit',
      model: 'TS4 Thunderbolt 4 Dock (18-in-1)',
      serialNumber: 'CDTS4899120',
      purchaseDate: new Date('2023-09-01'),
      purchaseCost: 36000,
      location: 'HQ IT Locker A',
      status: 'AVAILABLE',
      notes: 'High-power 230W Thunderbolt 4 hub'
    },

    // Software Licenses
    {
      assetTag: 'LIC-001',
      category: 'SOFTWARE_LICENSE',
      brand: 'JetBrains',
      model: 'All Products Pack Enterprise',
      serialNumber: 'JB-CORP-988210',
      purchaseDate: new Date('2024-01-01'),
      purchaseCost: 145000,
      location: 'Cloud SaaS / JetBrains Account',
      status: 'AVAILABLE',
      notes: 'Annual developer IDE suite license',
      licenseKey: 'JB-ENT-2024-8849-XKLA-9921',
      seatQuota: 10,
      costPerSeat: 14500,
      expirationDate: new Date('2026-12-31')
    },
    {
      assetTag: 'LIC-002',
      category: 'SOFTWARE_LICENSE',
      brand: 'Figma',
      model: 'Enterprise Design & FigJam Seat',
      serialNumber: 'FIG-ENT-2024',
      purchaseDate: new Date('2024-02-01'),
      purchaseCost: 180000,
      location: 'Cloud SaaS / Figma Org',
      status: 'AVAILABLE',
      notes: 'Design team org license with version history',
      licenseKey: 'FIGMA-ORG-LICENSE-99281-XYZ',
      seatQuota: 5,
      costPerSeat: 36000,
      expirationDate: new Date('2026-09-30')
    },
    {
      assetTag: 'LIC-003',
      category: 'SOFTWARE_LICENSE',
      brand: 'Postman',
      model: 'Enterprise API Platform',
      serialNumber: 'POSTMAN-ENT-77',
      purchaseDate: new Date('2023-11-01'),
      purchaseCost: 65000,
      location: 'Cloud SaaS / Postman Workspace',
      status: 'AVAILABLE',
      notes: 'API collaboration and mock servers',
      licenseKey: 'PM-ENT-KEY-881290-AA',
      seatQuota: 8,
      costPerSeat: 8125,
      expirationDate: new Date('2026-10-15')
    }
  ];

  const assets = {};
  for (const assetData of assetsData) {
    const created = await prisma.asset.create({ data: assetData });
    assets[assetData.assetTag] = created;
  }
  console.log(`Created ${Object.keys(assets).length} assets.`);

  // 5. Seed Custody Records
  // LAP-001 assigned to Rahul Sharma
  await prisma.custodyRecord.create({
    data: {
      assetId: assets['LAP-001'].id,
      employeeId: employees['EMP-1001'].id,
      checkoutDate: new Date('2024-01-15'),
      conditionCheckout: 'EXCELLENT',
      notes: 'Issued with original 140W MagSafe charger and sleeve'
    }
  });

  // LAP-002 assigned to Priya Patel
  await prisma.custodyRecord.create({
    data: {
      assetId: assets['LAP-002'].id,
      employeeId: employees['EMP-1002'].id,
      checkoutDate: new Date('2024-02-18'),
      conditionCheckout: 'NEW',
      notes: 'Brand new unboxed machine'
    }
  });

  // MON-001 assigned to Rahul Sharma
  await prisma.custodyRecord.create({
    data: {
      assetId: assets['MON-001'].id,
      employeeId: employees['EMP-1001'].id,
      checkoutDate: new Date('2023-10-10'),
      conditionCheckout: 'EXCELLENT',
      notes: 'Includes DP and USB-C upstream cables'
    }
  });

  // MOB-001 assigned to Priya Patel
  await prisma.custodyRecord.create({
    data: {
      assetId: assets['MOB-001'].id,
      employeeId: employees['EMP-1002'].id,
      checkoutDate: new Date('2023-08-25'),
      conditionCheckout: 'GOOD',
      notes: 'iPad + Apple Pencil bundle'
    }
  });

  // PER-001 assigned to Rahul Sharma
  await prisma.custodyRecord.create({
    data: {
      assetId: assets['PER-001'].id,
      employeeId: employees['EMP-1001'].id,
      checkoutDate: new Date('2023-07-15'),
      conditionCheckout: 'EXCELLENT',
      notes: 'Logi Bolt USB receiver included'
    }
  });

  // MON-003 assigned to Priya Patel (now RETURN_REQUESTED)
  await prisma.custodyRecord.create({
    data: {
      assetId: assets['MON-003'].id,
      employeeId: employees['EMP-1002'].id,
      checkoutDate: new Date('2023-05-01'),
      conditionCheckout: 'EXCELLENT',
      notes: 'Desk setup monitor'
    }
  });

  // Historical closed custody: LAP-003 was previously assigned to Amit Verma before repair
  await prisma.custodyRecord.create({
    data: {
      assetId: assets['LAP-003'].id,
      employeeId: employees['EMP-1003'].id,
      checkoutDate: new Date('2023-09-15'),
      checkinDate: new Date('2024-03-10'),
      conditionCheckout: 'NEW',
      conditionReturn: 'NEEDS_REPAIR',
      notes: 'Returned due to faulty trackpad'
    }
  });

  console.log('Created custody records.');

  // 6. Seed Return Requests
  await prisma.returnRequest.create({
    data: {
      assetId: assets['MON-003'].id,
      employeeId: employees['EMP-1002'].id,
      reason: 'Relocating to permanent remote setup; requesting compact single display',
      conditionNotes: 'Screen pristine, no scratches, original box preserved',
      status: 'PENDING',
      requestedAt: new Date('2026-09-18')
    }
  });
  console.log('Created return requests.');

  // 7. Seed Service Records
  await prisma.serviceRecord.create({
    data: {
      assetId: assets['LAP-003'].id,
      vendor: 'Lenovo Authorized Service Partner (Nehru Place)',
      issue: 'Trackpad hardware gesture failure and intermittent click detection',
      cost: 4500,
      serviceDate: new Date('2024-03-12'),
      status: 'OPEN'
    }
  });
  console.log('Created service records.');

  // 8. Seed Software License Allocations
  // JetBrains (LIC-001): Rahul Sharma & Amit Verma
  await prisma.licenseAllocation.create({
    data: {
      assetId: assets['LIC-001'].id,
      employeeId: employees['EMP-1001'].id,
      allocatedAt: new Date('2024-01-05'),
      status: 'ACTIVE',
      notes: 'IntelliJ IDEA Ultimate'
    }
  });

  await prisma.licenseAllocation.create({
    data: {
      assetId: assets['LIC-001'].id,
      employeeId: employees['EMP-1003'].id,
      allocatedAt: new Date('2024-01-10'),
      status: 'ACTIVE',
      notes: 'GoLand & PyCharm'
    }
  });

  await prisma.licenseAllocation.create({
    data: {
      assetId: assets['LIC-001'].id,
      employeeId: employees['EMP-1006'].id,
      allocatedAt: new Date('2024-02-15'),
      status: 'ACTIVE',
      notes: 'WebStorm'
    }
  });

  // Figma (LIC-002): Priya Patel & David Miller
  await prisma.licenseAllocation.create({
    data: {
      assetId: assets['LIC-002'].id,
      employeeId: employees['EMP-1002'].id,
      allocatedAt: new Date('2024-02-05'),
      status: 'ACTIVE',
      notes: 'Lead designer editor seat'
    }
  });

  await prisma.licenseAllocation.create({
    data: {
      assetId: assets['LIC-002'].id,
      employeeId: employees['EMP-1005'].id,
      allocatedAt: new Date('2024-02-10'),
      status: 'ACTIVE',
      notes: 'Product spec wireframes'
    }
  });

  console.log('Created license allocations.');

  // 9. Seed Audit Logs
  const auditEntries = [
    {
      action: 'SYSTEM_INITIALIZED',
      entityType: 'SYSTEM',
      entityId: null,
      details: 'Enterprise Asset Management system initialized with seed database records.',
      performedBy: adminUser.id,
      createdAt: new Date('2024-01-01')
    },
    {
      action: 'ASSET_CREATED',
      entityType: 'ASSET',
      entityId: assets['LAP-001'].id,
      details: `Created LAPTOP asset [${assets['LAP-001'].assetTag}] Apple MacBook Pro 16" M3 Max`,
      performedBy: adminUser.id,
      createdAt: new Date('2024-01-10')
    },
    {
      action: 'ASSET_ASSIGNED',
      entityType: 'CUSTODY',
      entityId: assets['LAP-001'].id,
      details: `Asset [LAP-001] assigned to Rahul Sharma (EMP-1001). Condition: EXCELLENT`,
      performedBy: adminUser.id,
      createdAt: new Date('2024-01-15')
    },
    {
      action: 'LICENSE_ALLOCATED',
      entityType: 'LICENSE',
      entityId: assets['LIC-001'].id,
      details: `License seat for [JetBrains All Products Pack Enterprise] allocated to Rahul Sharma (EMP-1001)`,
      performedBy: adminUser.id,
      createdAt: new Date('2024-01-16')
    },
    {
      action: 'REPAIR_STARTED',
      entityType: 'SERVICE',
      entityId: assets['LAP-003'].id,
      details: `Asset [LAP-003] sent for repair to vendor Lenovo Authorized Service Partner. Issue: Trackpad hardware gesture failure`,
      performedBy: adminUser.id,
      createdAt: new Date('2024-03-12')
    },
    {
      action: 'RETURN_REQUESTED',
      entityType: 'RETURN_REQUEST',
      entityId: assets['MON-003'].id,
      details: `Return requested for asset [MON-003] by Priya Patel. Reason: Relocating to permanent remote setup`,
      performedBy: adminUser.id,
      createdAt: new Date('2026-09-18')
    }
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
