import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { SocketHandlers } from "./handlers";

export const setupSocket = (io: Server, prisma: PrismaClient) => {
  const handlers = new SocketHandlers(io, prisma);

  io.on("connection", (socket) => {
    console.log("Client connected", socket.id);

    socket.on("addItem", handlers.handleAddItem.bind(handlers));
    socket.on("addFolder", handlers.handleAddFolder.bind(handlers));
    socket.on("updateItems", handlers.handleUpdateItems.bind(handlers));
    socket.on("updateFolders", handlers.handleUpdateFolders.bind(handlers));

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });
};
