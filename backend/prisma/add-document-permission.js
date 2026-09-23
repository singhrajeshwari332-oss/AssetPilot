import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const permission = await prisma.permission.upsert({
    where: {
      name: 'DOCUMENT_VIEW',
    },
    update: {},
    create: {
      name: 'DOCUMENT_VIEW',
      description: 'View and manage digital handover and return documents',
    },
  });

  const roles = ['EMPLOYEE', 'SUPER_ADMIN'];

  for (const roleName of roles) {
    const role = await prisma.role.findUnique({
      where: {
        name: roleName,
      },
    });

    if (!role) {
      throw new Error(`${roleName} role not found.`);
    }

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });

    console.log(`DOCUMENT_VIEW permission added to ${roleName}.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());