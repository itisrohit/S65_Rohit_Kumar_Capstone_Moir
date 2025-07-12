import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
 
const API_PREFIX = "/api/v1";


//-------------------------------------------------
// Routes Import
import userRoutes from "./routes/user.route";
import conversationRouter from './routes/conversation.route';
import friendRouter from './routes/friend.route';

// Routes
app.use(`${API_PREFIX}/user`, userRoutes);
app.use(`${API_PREFIX}/conversation`, conversationRouter);
app.use(`${API_PREFIX}/friend`, friendRouter);
//-------------------------------------------------


// Health check route
app.get(`${API_PREFIX}/health`, (_: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Server is up and running",
  });
});

// Root route
app.get(`${API_PREFIX}`, (_: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the API",
  });
});

export { app };
