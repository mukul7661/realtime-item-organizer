import request from "supertest";
import express from "express";
import { createApiRouter } from "../routes/api";
import { mockPrisma } from "../mocks/prisma.mock";
import { S3Service } from "../services/s3Service";

const app = express();

beforeAll(() => {
  jest.mock("../services/s3Service");
  const mockS3Service = new S3Service() as jest.Mocked<S3Service>;
  mockS3Service.getSignedUrl = jest.fn().mockResolvedValue("signed-url");

  app.use(express.json());
  app.use(
    "/api",
    createApiRouter({
      prisma: mockPrisma as any,
      s3Service: mockS3Service,
    })
  );
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("API Routes", () => {
  describe("GET /api/initial-state", () => {
    it("should return initial state with signed URLs", async () => {
      const mockItems = [
        {
          id: "1",
          title: "Item 1",
          icon: "https://example.com/test.png",
        },
      ];
      const mockFolders = [{ id: "1", name: "Folder 1" }];

      mockPrisma.item.findMany.mockResolvedValueOnce(mockItems);
      mockPrisma.folder.findMany.mockResolvedValueOnce(mockFolders);

      const response = await request(app).get("/api/initial-state");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        items: [
          {
            ...mockItems[0],
            icon: "signed-url",
          },
        ],
        folders: mockFolders,
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
