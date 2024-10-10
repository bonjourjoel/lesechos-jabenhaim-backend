import * as sanitizeHtml from 'sanitize-html';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * This middleware sanitizes the request body and query parameters using `sanitize-html` to prevent XSS attacks.
 */

@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Sanitize the request body
    if (req.body) {
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeHtml(req.body[key]);
        }
      });
    }

    // Sanitize the query string parameters
    if (req.query) {
      Object.keys(req.query).forEach((key) => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeHtml(req.query[key]);
        }
      });
    }

    next();
  }
}
