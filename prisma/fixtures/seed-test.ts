import { PrismaClient } from '@prisma/client';
import { hashPassword } from 'src/common/utils/password-hasher.utils';

export const TEST_USER_1 = 'testuser1';
export const TEST_USER_ADMIN = 'adminuser';
export const TEST_PASSWORD = 'password';

const prisma = new PrismaClient();

export async function seedTestDatabase() {
  await prisma.$transaction(async (prisma) => {
    // delete users data and reset auto-increment
    await prisma.user.deleteMany();
    await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name='User'`;

    // create users
    await prisma.user.createMany({
      data: [
        {
          username: TEST_USER_1,
          passwordHashed: await hashPassword(TEST_PASSWORD),
          name: 'Test User One',
          address: '123 Main St',
          comment: 'First test user',
          userType: 'USER',
        },
        {
          username: TEST_USER_ADMIN,
          passwordHashed: await hashPassword(TEST_PASSWORD),
          name: 'Admin User',
          address: '456 Admin Rd',
          comment: 'Administrator user',
          userType: 'ADMIN',
        },
      ],
    });
  });
}
