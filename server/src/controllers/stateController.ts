import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

export class StateController {
  constructor(private prisma: PrismaClient) {}

  getInitialState = async (_req: Request, res: Response) => {
    try {
      const items = await this.prisma.item.findMany({
        orderBy: { order: "asc" },
      });
      const folders = await this.prisma.folder.findMany({
        orderBy: { order: "asc" },
        include: { items: true },
      });
      res.json({ items, folders });
    } catch (error) {
      console.error("Error fetching initial state:", error);
      res.status(500).json({ error: "Failed to fetch initial state" });
    }
  };
}
