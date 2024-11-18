import { Router } from "express";
import { StateController } from "../controllers/stateController";
import { PrismaClient } from "@prisma/client";

export const createApiRouter = (prisma: PrismaClient) => {
  const router = Router();
  const stateController = new StateController(prisma);

  router.get("/initial-state", stateController.getInitialState);

  return router;
};
