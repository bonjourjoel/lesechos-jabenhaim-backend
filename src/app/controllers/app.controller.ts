import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AppService } from '../services/app.service';
import { Controller, Inject } from '@nestjs/common';
import { Logger } from 'winston';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    logger.info('AppController initialzed'); // use this here to make sure to pass the unit tests with the logger ran
  }
}
