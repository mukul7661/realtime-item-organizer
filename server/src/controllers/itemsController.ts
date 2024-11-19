import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { S3Service } from "../services/s3Service";

export class ItemsController {
  constructor(private prisma: PrismaClient, private s3Service: S3Service) {}

  createItem = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Icon file is required" });
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: "Invalid file type" });
      }

      const iconUrl = await this.s3Service.uploadFile(req.file);

      const newItem = await this.prisma.item.create({
        data: {
          id: req.body.id,
          title: req.body.title,
          icon: iconUrl,
          order: parseInt(req.body.order),
          folderId: null,
        },
      });

      res.json(newItem);
    } catch (error) {
      console.error("Failed to create item:", error);
      res.status(500).json({ error: "Failed to create item" });
    }
  };
}
