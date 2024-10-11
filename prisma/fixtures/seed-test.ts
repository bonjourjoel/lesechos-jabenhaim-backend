import { PrismaClient } from '@prisma/client';
import { USER_TYPE } from 'src/common/enums/user-type.enum';
import { hashPassword } from 'src/common/utils/password-hasher.utils';

export const TEST_USERNAME_1 = 'testuser1';
export const TEST_USERNAME_ADMIN = 'adminuser';
export const TEST_PASSWORD = 'password';

const prisma = new PrismaClient();

export async function seedTestDatabase() {
  await prisma.$transaction(async (prisma) => {
    // delete users data and reset auto-increment
    await Promise.all([
      prisma.user.deleteMany(),
      prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name='User'`,
    ]);

    // create users
    await prisma.user.createMany({
      data: [
        {
          username: TEST_USERNAME_1,
          passwordHashed: await hashPassword(TEST_PASSWORD),
          name: 'Test User One',
          address: '123 Main St',
          comment: 'First test user',
          userType: USER_TYPE.USER,
        },
        {
          username: TEST_USERNAME_ADMIN,
          passwordHashed: await hashPassword(TEST_PASSWORD),
          name: 'Admin User',
          address: '456 Admin Rd',
          comment: 'Administrator user',
          userType: USER_TYPE.ADMIN,
        },
      ],
    });
  });
}
