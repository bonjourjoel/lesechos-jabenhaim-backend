import { PrismaClient } from '@prisma/client';

export const TEST_USER_1 = 'testuser1';
export const TEST_USER_ADMIN = 'adminuser';
export const TEST_PASSWORD = 'password';

const prisma = new PrismaClient();

export async function seedDatabase() {
  // delete users data and reset auto-increment
  await prisma.user.deleteMany();
  await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name='User'`;

  // create users
  await prisma.user.createMany({
    data: [
      {
        username: TEST_USER_1,
        passwordHashed:
          '$2a$10$SA5gMDqsJYI/UGIrd6CPf.BuNO2J1G07DTIGRhPAhGA0XUdFYoXGa', // Hashed password for "password"
        name: 'Test User One',
        address: '123 Main St',
        comment: 'First test user',
        userType: 'USER',
      },
      {
        username: TEST_USER_ADMIN,
        passwordHashed:
          '$2a$10$n7oeLwYQysN1GbvkyaottudXF6dcsiYrHJoD.tj6lfn2P1bA6AnRy', // Hashed password for "password"
        name: 'Admin User',
        address: '456 Admin Rd',
        comment: 'Administrator user',
        userType: 'ADMIN',
      },
    ],
  });
}

// Run this function only if the script is launched directly
if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
