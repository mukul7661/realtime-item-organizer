import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { createApiRouter } from "./routes/api";
import { setupSocket } from "./socket";
import { S3Service } from "./services/s3Service";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.DEV_CLIENT_URL || process.env.PREVIEW_CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

const prisma = new PrismaClient();
const s3Service = new S3Service();

app.use(cors());
app.use(express.json());

app.use(
  "/api",
  createApiRouter({
    prisma,
    s3Service,
  })
);

setupSocket(io, prisma, s3Service);

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, httpServer };
