import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/services/prisma.service';
import { hashToken } from 'src/common/utils/token-hasher.utils';
import { prismaErrorMiddleware } from 'src/common/utils/prisma-error-middleware.utils';

@Injectable()
export class AuthDbService {
  constructor(private prisma: PrismaService) {}

  async updateRefreshToken(userId: number, refreshToken: string) {
    const refreshTokenHashed: string = await hashToken(refreshToken);
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHashed },
      });
    } catch (error) {
      throw prismaErrorMiddleware(error);
    }
  }

  async removeRefreshToken(userId: number) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHashed: null }, // Invalidate the Refresh Token by setting it to null
      });
    } catch (error) {
      throw prismaErrorMiddleware(error);
    }
  }
}
