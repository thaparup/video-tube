import express from 'express';
import { requestBodySize } from './constants';
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json({limit:requestBodySize}))
app.use(express.urlencoded({extended: true,limit: requestBodySize}))
app.use(express.static("public"))
app.use(cookieParser())


export { app };
