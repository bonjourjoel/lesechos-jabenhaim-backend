import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

enum PRISMA_ERROR_CODE {
  RECORD_NOT_FOUND = 'P2025',
}

export function prismaErrorMiddleware(error: any): any {
  // format the error message to return the prisma error in the http error
  const errMsg: string = error.message || 'Unknown prisma error';
  // handle the known errors appriopriately
  if (error.code === PRISMA_ERROR_CODE.RECORD_NOT_FOUND) {
    return new NotFoundException(errMsg);
  } else {
    // format the unknown errors properly to return the prisma error in the http error
    const errMsg: string = error.message || 'Unknown prisma error';
    return new InternalServerErrorException(errMsg);
  }
}
