import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { Item, Folder } from "../types";
import {
  itemSchema,
  folderSchema,
  updateItemsSchema,
  updateFoldersSchema,
} from "../schemas/validation";

export class SocketHandlers {
  constructor(private io: Server, private prisma: PrismaClient) {}

  async handleAddItem(item: unknown) {
    try {
      const validatedItem = itemSchema.parse(item);
      await this.prisma.item.create({
        data: {
          id: validatedItem.id,
          title: validatedItem.title,
          icon: validatedItem.icon,
          folderId: validatedItem.folderId,
          order: validatedItem.order,
        },
      });
      const updatedItems = await this.prisma.item.findMany({
        orderBy: { order: "asc" },
      });
      this.io.emit("updateState", { items: updatedItems });
    } catch (error) {
      console.error("Failed to add item:", error);
      this.io.emit("error", { message: "Invalid item data" });
    }
  }

  async handleAddFolder(folder: unknown) {
    try {
      const validatedFolder = folderSchema.parse(folder);
      await this.prisma.folder.create({
        data: {
          id: validatedFolder.id,
          name: validatedFolder.name,
          isOpen: validatedFolder.isOpen,
          order: validatedFolder.order,
        },
      });
      const updatedFolders = await this.prisma.folder.findMany({
        orderBy: { order: "asc" },
        include: { items: true },
      });
      this.io.emit("updateState", { folders: updatedFolders });
    } catch (error) {
      console.error("Failed to add folder:", error);
      this.io.emit("error", { message: "Invalid folder data" });
    }
  }

  async handleUpdateItems(items: unknown) {
    try {
      const validatedItems = updateItemsSchema.parse(items);
      await this.prisma.$transaction(
        validatedItems.map((item) =>
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
      this.io.emit("error", { message: "Invalid items data" });
    }
  }

  async handleUpdateFolders(folders: unknown) {
    try {
      const validatedFolders = updateFoldersSchema.parse(folders);
      await this.prisma.$transaction(
        validatedFolders.map((folder) =>
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
      this.io.emit("error", { message: "Invalid folders data" });
    }
  }
}
