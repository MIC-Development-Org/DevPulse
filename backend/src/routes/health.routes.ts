import { Router } from "express";
import { getDatabaseHealth, getHealth } from "../controllers/health.controller";

export const healthRoutes = Router();

healthRoutes.get("/", getHealth);
healthRoutes.get("/db", getDatabaseHealth);
