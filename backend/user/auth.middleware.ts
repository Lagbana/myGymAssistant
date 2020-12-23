import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { NestMiddleware, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {

    async use(req: Request, res: Response, next: NextFunction) {
        // const authHeaders = req.headers.authorization;
        try {
            return next()
        } catch  {
            throw new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED); 
        }
        
    }
}