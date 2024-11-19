import { Server } from "socket.io";
import { createServer } from "http";
import Client from "socket.io-client";
import { setupSocket } from "../socket";
import { mockPrisma } from "../mocks/prisma.mock";
import { S3Service } from "../services/s3Service";

jest.mock("../services/s3Service");

describe("Socket.io Server", () => {
  let io: Server;
  let clientSocket: any;
  let httpServer: any;
  let mockS3Service: jest.Mocked<S3Service>;

  beforeAll((done) => {
    mockS3Service = new S3Service() as jest.Mocked<S3Service>;
    mockS3Service.getSignedUrl = jest.fn().mockResolvedValue("signed-url");

    httpServer = createServer();
    io = new Server(httpServer);
    setupSocket(io, mockPrisma as any, mockS3Service);
    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on("connect", done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addItem", () => {
    it("should handle adding an item", (done) => {
      const mockItem = {
        id: "1",
        title: "Test Item",
        icon: "https://example.com/test.png",
        folderId: null,
        order: 0,
      };

      mockPrisma.item.findUnique.mockResolvedValueOnce(mockItem);

      clientSocket.emit("addItem", mockItem.id);

      clientSocket.once("newItem", (data: any) => {
        try {
          expect(data.newItem).toEqual({
            ...mockItem,
            icon: "signed-url",
          });
          expect(mockPrisma.item.findUnique).toHaveBeenCalledWith({
            where: { id: mockItem.id },
          });
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe("addFolder", () => {
    it("should handle adding a folder", (done) => {
      const mockFolder = {
        id: "1",
        name: "Test Folder",
        isOpen: false,
        order: 0,
      };

      const mockUpdatedFolders = [mockFolder];
      mockPrisma.folder.create.mockResolvedValueOnce(mockFolder);
      mockPrisma.folder.findMany.mockResolvedValueOnce(mockUpdatedFolders);

      clientSocket.emit("addFolder", mockFolder);

      clientSocket.once("updateState", (data: any) => {
        try {
          expect(data.folders).toEqual(mockUpdatedFolders);
          expect(mockPrisma.folder.create).toHaveBeenCalledWith({
            data: mockFolder,
          });
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 10000);
  });

  describe("updateItems", () => {
    it("should handle updating items", (done) => {
      const mockItems = [
        {
          id: "1",
          title: "Updated Item",
          icon: "📝",
          folderId: null,
          order: 1,
        },
      ];

      mockPrisma.$transaction.mockResolvedValueOnce(mockItems);
      mockPrisma.item.findMany.mockResolvedValueOnce(mockItems);

      clientSocket.emit("updateItems", mockItems);

      clientSocket.once("updateState", (data: any) => {
        try {
          expect(data.items).toEqual(mockItems);
          expect(mockPrisma.$transaction).toHaveBeenCalled();
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 10000);
  });

  describe("updateFolders", () => {
    it("should handle updating folders", (done) => {
      const mockFolders = [
        {
          id: "1",
          name: "Updated Folder",
          isOpen: true,
          order: 1,
        },
      ];

      mockPrisma.$transaction.mockResolvedValueOnce(mockFolders);
      mockPrisma.folder.findMany.mockResolvedValueOnce(mockFolders);

      clientSocket.emit("updateFolders", mockFolders);

      clientSocket.once("updateState", (data: any) => {
        try {
          expect(data.folders).toEqual(mockFolders);
          expect(mockPrisma.$transaction).toHaveBeenCalled();
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 10000);
  });
});
