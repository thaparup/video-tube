import mongoose from 'mongoose';
import { DB_NAME } from '../constants';

const connectDb = async () :Promise<boolean> => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}${DB_NAME}`,
    );

    console.log(connectionInstance.connection.name);
   
      return true
    
  } catch (error) {
    console.log('MONGODB connection failed ', error);
    return false
  }
};

export default connectDb;
