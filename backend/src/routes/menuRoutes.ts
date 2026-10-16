import { Router } from "express";
import {
  createMenuItem,
  getMenuItems,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController.js";
import {
  authenticate,
  authorize,
} from "../middleware/authMiddleware.js";

const router = Router();

// All menu routes require authentication
router.use(authenticate);

// Admin and staff can view the menu
router.get("/", getMenuItems);

// Only admins can manage menu items
router.post("/", authorize("admin"), createMenuItem);
router.patch("/:id", authorize("admin"), updateMenuItem);
router.delete("/:id", authorize("admin"), deleteMenuItem);

export default router;
