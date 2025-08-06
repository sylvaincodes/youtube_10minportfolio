//Ensure mongo db URI is defined

import mongoose from "mongoose";
import { devLog } from "./utils";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  devLog.error("Please define the MONGODB_URI environment variable in .env");
  throw new Error("MONGO URI not found");
}

// Interface for caching the mongoose connection across hot reloads in dev
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use a global variable to persist connection cache across reloads in dev
declare global {
  var myMongoose: MongooseCache | undefined;
}

// Initialise cache object if not already defined
let cached = global.myMongoose;

if (!cached) {
  cached = global.myMongoose = { conn: null, promise: null };
}

// Connect to mongoDB
async function connectDB(): Promise<typeof mongoose> {
  //return cached connection if it exists
  if (cached!.conn) {
    return cached!.conn;
  }

  // If not already connecting, create a new connection promise
  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,

      //increase this to wait longerfor mongoBD to be found
      serverSelectionTimeoutMS: 20000, //20 seconds

      //increase this if large queries take longer to respond
      socketTimeoutMS: 60000, // 60 seconds

      family: 4,
    };

    //Initiate the connection
    cached!.promise = mongoose.connect(MONGO_URI!, opts).then((mongoose) => {
      devLog.warn("Connected to MongoDB!");
      return mongoose;
    });
  }

  try {
    //Await the connection and cache it
    cached!.conn = await cached!.promise;
  } catch (error) {
    cached!.promise = null;
    devLog.error("Error while connecting and caching the connection");
    throw error;
  }

  return cached!.conn;
}

export default connectDB;
