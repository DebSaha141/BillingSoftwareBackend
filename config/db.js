const mongoose = require("mongoose");

let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  try {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI);
    const conn = await connectionPromise;
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Register listeners once to avoid duplicate logs on hot reloads.
    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      connectionPromise = null;
      console.warn("MongoDB disconnected. Attempting reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      isConnected = true;
      console.log("MongoDB reconnected");
    });

    return mongoose.connection;
  } catch (error) {
    connectionPromise = null;
    isConnected = false;
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
