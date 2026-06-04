import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI as string;
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};
