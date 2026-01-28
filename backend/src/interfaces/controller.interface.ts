import { Request, Response, NextFunction } from 'express';

export interface IController {
  register: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}