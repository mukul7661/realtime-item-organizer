import request from "supertest";
import express from "express";
import { createApiRouter } from "../routes/api";
import { mockPrisma } from "../mocks/prisma.mock";

const app = express();

beforeAll(() => {
  app.use(express.json());
  app.use("/api", createApiRouter(mockPrisma as any));
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("API Routes", () => {
  describe("GET /api/initial-state", () => {
    it("should return initial state successfully", async () => {
      const mockItems = [{ id: "1", title: "Item 1" }];
      const mockFolders = [{ id: "1", name: "Folder 1" }];

      mockPrisma.item.findMany.mockResolvedValueOnce(mockItems);
      mockPrisma.folder.findMany.mockResolvedValueOnce(mockFolders);

      const response = await request(app).get("/api/initial-state");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ items: mockItems, folders: mockFolders });
      expect(mockPrisma.item.findMany).toHaveBeenCalledWith({
        orderBy: { order: "asc" },
      });
      expect(mockPrisma.folder.findMany).toHaveBeenCalledWith({
        orderBy: { order: "asc" },
        include: { items: true },
      });
    });

    it("should handle errors", async () => {
      mockPrisma.item.findMany.mockRejectedValueOnce(
        new Error("Database error")
      );

      const response = await request(app).get("/api/initial-state");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Failed to fetch initial state" });
    });
  });
});
