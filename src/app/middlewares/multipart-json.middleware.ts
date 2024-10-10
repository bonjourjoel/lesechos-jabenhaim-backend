import * as bodyParser from 'body-parser';
import * as multer from 'multer';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware that handles both `multipart/form-data` and `application/json` requests.
 * It processes file uploads and non-file fields from `multipart/form-data` and parses
 * `application/json` requests into `req.body`.
 *
 * Usage in a controller endpoint:
 * - Add the middleware globally in `app.module.ts` to handle all routes or apply it to specific routes.
 * - In the controller, use `@ApiConsumes('application/json', 'multipart/form-data')` to specify both types.
 *
 * Example in a controller:
 * @Post('upload')
 * @ApiConsumes('multipart/form-data', 'application/json')
 * async uploadData(@Body() dto: MyDto) {
 *   // Handle the parsed data from req.body
 * }
 *
 * Required npm packages:
 * - multer: Handles `multipart/form-data` parsing
 * - body-parser: Handles `application/json` parsing
 * - @types/multer: Provides TypeScript types for multer
 * - @types/express: Provides TypeScript types for express
 *
 * Install with:
 * npm install multer body-parser
 * npm install --save-dev @types/multer @types/express
 */

@Injectable()
export class MultipartJsonMiddleware implements NestMiddleware {
  private readonly upload = multer().any(); // To handle multipart forms

  use(req: Request, res: Response, next: NextFunction) {
    const contentType = req.headers['content-type'];

    if (contentType?.includes('multipart/form-data')) {
      // If content-type is multipart/form-data, use multer to parse
      this.upload(req, res, (err: any) => {
        if (err) {
          return next(err);
        }
        // Handle non-file fields (variables in the form)
        Object.assign(req.body, req.body); // req.body will contain non-file fields
        // Handle file fields
        if (Array.isArray(req.files)) {
          req.files.forEach((file: Express.Multer.File) => {
            req.body[file.fieldname] = file.buffer.toString(); // Convert buffer to string
          });
        }
        next();
      });
    } else if (contentType?.includes('application/json')) {
      // If content-type is application/json, use body-parser to parse
      bodyParser.json()(req, res, next);
    } else {
      next();
    }
  }
}
