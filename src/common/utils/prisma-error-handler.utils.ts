import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

enum PRISMA_ERROR_CODE {
  RECORD_NOT_FOUND = 'P2025',
}

export function prismaErrorMiddleware(error: any): any {
  // handle the known errors appriopriately
  if (error.code === PRISMA_ERROR_CODE.RECORD_NOT_FOUND) {
    return new NotFoundException();
  } else {
    // format the unknown errors properly
    const errMsg: string = error.message || 'Unknown prisma error';
    return new InternalServerErrorException(errMsg);
  }
}
