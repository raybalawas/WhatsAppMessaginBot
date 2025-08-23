import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Mongo db connected on ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error on connection of database`);
  }
};

export default connectDB;
