import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { Item, Folder } from "../types";

export class SocketHandlers {
  constructor(private io: Server, private prisma: PrismaClient) {}

  async handleAddItem(item: Item) {
    try {
      await this.prisma.item.create({
        data: {
          id: item.id,
          title: item.title,
          icon: item.icon,
          folderId: item.folderId,
          order: item.order,
        },
      });
      const updatedItems = await this.prisma.item.findMany({
        orderBy: { order: "asc" },
      });
      this.io.emit("updateState", { items: updatedItems });
    } catch (error) {
      console.error("Failed to add item:", error);
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  }

  async handleAddFolder(folder: Folder) {
    try {
      await this.prisma.folder.create({
        data: {
          id: folder.id,
          name: folder.name,
          isOpen: folder.isOpen,
          order: folder.order,
        },
      });
      const updatedFolders = await this.prisma.folder.findMany({
        orderBy: { order: "asc" },
        include: { items: true },
      });
      this.io.emit("updateState", { folders: updatedFolders });
    } catch (error) {
      console.error("Failed to add folder:", error);
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  }

  async handleUpdateItems(items: Item[]) {
    try {
      await this.prisma.$transaction(
        items.map((item) =>
          this.prisma.item.upsert({
            where: { id: item.id },
            update: {
              title: item.title,
              icon: item.icon,
              folderId: item.folderId,
              order: item.order,
            },
            create: {
              id: item.id,
              title: item.title,
              icon: item.icon,
              folderId: item.folderId,
              order: item.order,
            },
          })
        )
      );
      const updatedItems = await this.prisma.item.findMany({
        orderBy: { order: "asc" },
      });
      this.io.emit("updateState", { items: updatedItems });
    } catch (error) {
      console.error("Failed to update items:", error);
    }
  }

  async handleUpdateFolders(folders: Folder[]) {
    try {
      await this.prisma.$transaction(
        folders.map((folder) =>
          this.prisma.folder.upsert({
            where: { id: folder.id },
            update: {
              name: folder.name,
              isOpen: folder.isOpen,
              order: folder.order,
            },
            create: {
              id: folder.id,
              name: folder.name,
              isOpen: folder.isOpen,
              order: folder.order,
            },
          })
        )
      );
      const updatedFolders = await this.prisma.folder.findMany({
        orderBy: { order: "asc" },
        include: { items: true },
      });
      this.io.emit("updateState", { folders: updatedFolders });
    } catch (error) {
      console.error("Failed to update folders:", error);
    }
  }
}
