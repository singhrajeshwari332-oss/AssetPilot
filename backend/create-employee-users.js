import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const employeeIds = [
  "EMP-1002",
  "EMP-1003",
  "EMP-1004",
  "EMP-1005",
  "EMP-1006",
];

const temporaryPassword = "password123";

try {
  const employeeRole = await prisma.role.findFirst({
    where: {
      name: "EMPLOYEE",
    },
  });

  if (!employeeRole) {
    throw new Error("EMPLOYEE role not found.");
  }

  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  for (const employeeId of employeeIds) {
    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    });

    if (!employee) {
      console.log(`Employee not found: ${employeeId}`);
      continue;
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        employeeId: employee.id,
      },
    });

    if (existingUser) {
      console.log(`User already exists: ${employee.name}`);
      continue;
    }

    await prisma.user.create({
      data: {
        email: employee.email,
        passwordHash,
        name: employee.name,
        roleId: employeeRole.id,
        employeeId: employee.id,
      },
    });

    console.log(`Created login: ${employee.email}`);
  }

  console.log("\nAll employee accounts processed.");
  console.log(`Temporary password: ${temporaryPassword}`);
} catch (error) {
  console.error("Error:", error);
} finally {
  await prisma.$disconnect();
}