import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

const signToken = (userId: string): string =>
  jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email and password are required' });
    return;
  }
  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400).json({ message: 'Email already registered' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });
  const token = signToken(user._id.toString());
  res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email } });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({ message: 'Invalid login credentials' });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: 'Invalid login credentials' });
    return;
  }
  const token = signToken(user._id.toString());
  res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.userId).select('-passwordHash');
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json(user);
};
