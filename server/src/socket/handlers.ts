import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { Item, Folder } from "../types";
import {
  itemSchema,
  folderSchema,
  updateItemsSchema,
  updateFoldersSchema,
} from "../schemas/validation";
import { S3Service } from "../services/s3Service";

export class SocketHandlers {
  constructor(
    private io: Server,
    private prisma: PrismaClient,
    private s3Service: S3Service = new S3Service()
  ) {}

  async handleAddItem(itemId: string) {
    try {
      const item = await this.prisma.item.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        return;
      }

      let itemWithSignedUrl = item;

      const urlParts = item.icon.split(".com/");
      const key = urlParts[1];

      try {
        const signedUrl = await this.s3Service.getSignedUrl(key);
        itemWithSignedUrl = {
          ...item,
          icon: signedUrl,
        };
      } catch (error) {
        console.error(`Failed to get signed URL for item ${item.id}:`, error);
        return item; // Fallback to original URL if signing fails
      }

      this.io.emit("newItem", { newItem: itemWithSignedUrl });
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
