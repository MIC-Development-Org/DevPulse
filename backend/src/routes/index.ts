import { Router } from "express";
import { healthRoutes } from "./health.routes";

export const router = Router();

router.use("/health", healthRoutes);
