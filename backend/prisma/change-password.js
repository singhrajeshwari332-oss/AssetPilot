import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma.js';

const users = [
  {
    email: 'admin@company.com',
    password: 'Admin@2026'
  },
  {
    email: 'it.support@company.com',
    password: 'ITSupport@2026'
  },
  {
    email: 'rahul.sharma@company.com',
    password: 'Rahul@1123'
  },
  {
    email: 'priya.patel@company.com',
    password: 'Priya@2026'
  },
  {
    email: 'amit.verma@company.com',
    password: 'Amit@2026'
  },
  {
    email: 'sneha.reddy@company.com',
    password: 'Sneha@0802'
  },
  {
    email: 'david.miller@company.com',
    password: 'David@2909'
  },
  {
    email: 'ananya.gupta@company.com',
    password: 'Ananya@2026'
  }
];

async function main() {
  console.log('Updating user passwords...\n');

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12);

    const updated = await prisma.user.update({
      where: {
        email: user.email
      },
      data: {
        passwordHash
      }
    });

    console.log(`Updated password: ${updated.email}`);
  }

  console.log('\nAll passwords updated successfully.');
}

main()
  .catch((error) => {
    console.error('Password update failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });