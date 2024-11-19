import { Router } from "express";
import multer from "multer";
import { StateController } from "../controllers/stateController";
import { ItemsController } from "../controllers/itemsController";
import { PrismaClient } from "@prisma/client";
import { S3Service } from "../services/s3Service";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_, file, cb) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/svg+xml"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const createApiRouter = ({
  prisma,
  s3Service,
}: {
  prisma: PrismaClient;
  s3Service: S3Service;
}) => {
  const router = Router();
  const stateController = new StateController(prisma, s3Service);
  const itemsController = new ItemsController(prisma, s3Service);

  router.get("/initial-state", stateController.getInitialState);
  router.post("/items", upload.single("icon"), itemsController.createItem);

  return router;
};
