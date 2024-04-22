import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
  response,
} from 'express';

// const asyncHandler = (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) =>{

//     try {
//         return fn(req,res,next)
//     } catch (error) {

//     }
// }

type typeRequestHandler<T> = (req: Request, res: Response) => Promise<T>;

const asyncHandler =
  <T>(fn: typeRequestHandler<T>) =>
  (req: Request, res: Response) => {
    return fn(req, res);
  };

export { asyncHandler };
