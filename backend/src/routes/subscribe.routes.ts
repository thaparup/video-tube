import { Router } from 'express';
import { sub } from '../controllers/subscibe.controller';

const router = Router();

router.route('/').post(sub);

export { router };
