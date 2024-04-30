import {
    type NextFunction,
    type Request,
    type RequestHandler,
    type Response,
} from 'express';

type typeRequestHandler<T> = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<T>;

const asyncHandler = (reqHandler: RequestHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(reqHandler(req, res, next)).catch((err) => next(err));
    };
};

export { asyncHandler };
