import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

enum PRISMA_ERROR_CODE {
  RECORD_NOT_FOUND = 'P2025',
}

export function prismaErrorMiddleware(error: any): any {
  // format the error message to return the prisma error in the http error
  const fullErrMsg: string = error.message || 'Unknown prisma error';
  const lines: string[] = fullErrMsg.split('\n');
  const errMsg = lines[lines.length - 1];
  // handle the errors with the appropriate http error
  switch (error.code) {
    case PRISMA_ERROR_CODE.RECORD_NOT_FOUND: {
      return new NotFoundException(errMsg);
    }
    default: {
      // format the unknown errors properly to return the prisma error in the http error 500
      return new InternalServerErrorException(errMsg);
    }
  }
}
