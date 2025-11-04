import express, { urlencoded } from "express";
import {createServer} from "node:http";
import {Server} from "socket.io";
import { Mongoose } from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/connectDB.js";
import connectToSocket from "./config/socketManager.js";
import userRoutes from "./routes/userRoutes.js"

dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);
const PORT = process.env.PORT || 8080 ;

app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({limit: "40kb", extended: true}));

app.use("/api/user", userRoutes);

const start = async () => {
    try {
        await connectDB(); // It's better to wait for the DB connection first

        // CORRECT
        server.listen(PORT, () => {
            console.log(`🚀 Server is listening on ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start the server:", error);
    }
};

start();