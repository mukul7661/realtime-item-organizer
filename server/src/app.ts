import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import http from "http";
import dotenv from "dotenv";
import { setupSocket } from "./socket";
import { createApiRouter } from "./routes/api";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL },
});

app.use("/api", createApiRouter(prisma));

setupSocket(io, prisma);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  console.log(
    "SIGTERM received. Closing HTTP server and database connection..."
  );
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});
