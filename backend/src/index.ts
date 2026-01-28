import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { UserController } from './controllers/user.controller';
import { IApiResponse } from './interfaces/response.interface';
import { validateRegisterBody, validateLoginBody } from './utils/validation.util';
import { API, ROUTES } from './constants/routes';
import authRoutes from './routes/auth.routes'
// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
})); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Appointment Scheduling System API is running!',
    statusCode: 200,
  } as IApiResponse);
});

// User routes
// app.post(ROUTES.AUTH.REGISTER, validateRegisterBody, UserController.register);
// app.post(ROUTES.AUTH.LOGIN, validateLoginBody, UserController.login);
app.use(`${API}${ROUTES.AUTH.BASE}`, authRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message,
    statusCode: 500,
  } as IApiResponse);
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    statusCode: 404,
  } as IApiResponse);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;