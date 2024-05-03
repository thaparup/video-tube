import cookieParser from 'cookie-parser';
import express from 'express';
import { requestBodySize } from './constants';

const app = express();

app.use(express.json({ limit: requestBodySize }));
app.use(express.urlencoded({ extended: true, limit: requestBodySize }));
app.use(express.static('public'));
app.use(cookieParser());

// routes

import { router as userRouter } from './routes/user.routes';
import { router as videoRouter } from './routes/video.routes';
import { router as subRouter } from './routes/subscribe.routes';
import { router as commentRouter } from './routes/comment.routes';
import { router as likeRouter } from './routes/like.routes';

app.use('/api/user', userRouter);
app.use('/api/video', videoRouter);
app.use('/api/sub', subRouter);
app.use('/api/comments', commentRouter);
app.use('/api/like', likeRouter);
export { app };
