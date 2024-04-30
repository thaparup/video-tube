import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { Subscription } from '../models/subscription.model';

const sub = asyncHandler(async (req: Request, res: Response) => {
    const sub = await Subscription.create({
        subscriber: '6625cb768babd1749651de09',
        channel: '6625cb768babd1749651de09',
    });
    res.send(sub);
});

export { sub };
