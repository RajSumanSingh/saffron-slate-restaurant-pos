
import { Router } from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
} from "../controllers/orderController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// All order routes require authentication
router.use(authenticate);

// Create and view orders
router.post("/", authorize("admin", "staff"), createOrder);
router.get("/", authorize("admin", "staff"), getOrders);

// Update order and payment status
router.patch("/:id/status", authorize("admin", "staff"), updateOrderStatus);
router.patch("/:id/payment", authorize("admin"), updatePaymentStatus);
router.delete("/:id", authorize("admin"), deleteOrder);

export default router;
