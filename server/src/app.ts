import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import clothingRoutes from './routes/clothingRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import { errorHandler } from './middleware/errorMiddleware';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/clothing', clothingRoutes);
app.use('/api/recommendations', recommendationRoutes);

app.use(errorHandler);

export default app;
