import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { S3Service } from "../services/s3Service";

export class StateController {
  constructor(private prisma: PrismaClient, private s3Service: S3Service) {}

  getInitialState = async (_req: Request, res: Response) => {
    try {
      const items = await this.prisma.item.findMany({
        orderBy: { order: "asc" },
      });

      // Get presigned URLs for all items
      const itemsWithSignedUrls = await Promise.all(
        items.map(async (item) => {
          // Extract the key from the full S3 URL
          const urlParts = item.icon.split(".com/");
          const key = urlParts[1];
          try {
            const signedUrl = await this.s3Service.getSignedUrl(key);
            return {
              ...item,
              icon: signedUrl,
            };
          } catch (error) {
            console.error(
              `Failed to get signed URL for item ${item.id}:`,
              error
            );
            return item; // Fallback to original URL if signing fails
          }
        })
      );

      const folders = await this.prisma.folder.findMany({
        orderBy: { order: "asc" },
        include: { items: true },
      });

      res.json({
        items: itemsWithSignedUrls,
        folders: folders,
      });
    } catch (error) {
      console.error("Error fetching initial state:", error);
      res.status(500).json({ error: "Failed to fetch initial state" });
    }
  };
}
