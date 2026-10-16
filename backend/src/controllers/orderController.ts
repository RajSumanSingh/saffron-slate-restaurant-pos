
import { Request, Response } from "express";
import mongoose from "mongoose";
import Order, {
  IOrderItem,
  OrderStatus,
  OrderType,
  PaymentStatus,
} from "../models/Order";
import MenuItem from "../models/Menu";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const TAX_RATE = 5;
const MAX_DISCOUNT_PERCENT = 15;

const roundMoney = (amount: number): number =>
  Math.round((amount + Number.EPSILON) * 100) / 100;

const generateOrderNumber = (): string =>
  `ORD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

// Create a new order.
export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      orderType = "dine-in",
      tableNumber,
      items,
      discountPercent = 0,
    } = req.body;

    const validOrderTypes: OrderType[] = [
      "dine-in",
      "takeaway",
      "delivery",
    ];

    if (!validOrderTypes.includes(orderType)) {
      res.status(400).json({
        success: false,
        message: "Invalid order type.",
      });
      return;
    }

    const parsedTableNumber =
      tableNumber === undefined || tableNumber === null
        ? undefined
        : Number(tableNumber);

    if (
      orderType === "dine-in" &&
      (!Number.isInteger(parsedTableNumber) ||
        (parsedTableNumber as number) < 1)
    ) {
      res.status(400).json({
        success: false,
        message: "A valid table number is required for dine-in orders.",
      });
      return;
    }

    const parsedDiscount = Number(discountPercent);

    if (
      !Number.isFinite(parsedDiscount) ||
      parsedDiscount < 0 ||
      parsedDiscount > MAX_DISCOUNT_PERCENT
    ) {
      res.status(400).json({
        success: false,
        message: `Discount must be between 0% and ${MAX_DISCOUNT_PERCENT}%.`,
      });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: "An order must contain at least one item.",
      });
      return;
    }

    const quantities = new Map<string, number>();

    for (const item of items) {
      const menuItemId = String(
        item?.menuItemId ?? item?.menuItem ?? ""
      );
      const quantity = Number(item?.quantity);

      if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
        res.status(400).json({
          success: false,
          message: "An invalid menu item was provided.",
        });
        return;
      }

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 100
      ) {
        res.status(400).json({
          success: false,
          message: "Each item quantity must be between 1 and 100.",
        });
        return;
      }

      const combinedQuantity =
        (quantities.get(menuItemId) ?? 0) + quantity;

      if (combinedQuantity > 100) {
        res.status(400).json({
          success: false,
          message: "The quantity of a menu item cannot exceed 100.",
        });
        return;
      }

      quantities.set(menuItemId, combinedQuantity);
    }

    const menuItemIds = Array.from(quantities.keys());

    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
    }).exec();

    if (menuItems.length !== menuItemIds.length) {
      res.status(400).json({
        success: false,
        message: "One or more menu items could not be found.",
      });
      return;
    }

    const menuItemMap = new Map(
      menuItems.map((menuItem) => [
        String(menuItem._id),
        menuItem,
      ])
    );

    const orderItems: IOrderItem[] = [];

    for (const [menuItemId, quantity] of quantities.entries()) {
      const menuItem = menuItemMap.get(menuItemId);

      if (!menuItem) {
        res.status(400).json({
          success: false,
          message: "One or more menu items could not be found.",
        });
        return;
      }

      const menuData = menuItem as typeof menuItem & {
        isAvailable?: boolean;
        isActive?: boolean;
        available?: boolean;
        active?: boolean;
      };

      if (
        menuData.isAvailable === false ||
        menuData.isActive === false ||
        menuData.available === false ||
        menuData.active === false
      ) {
        res.status(400).json({
          success: false,
          message: `${menuItem.name} is not currently available.`,
        });
        return;
      }

      const price = Number(menuItem.price);

      if (!Number.isFinite(price) || price < 0) {
        res.status(400).json({
          success: false,
          message: `Invalid price for ${menuItem.name}.`,
        });
        return;
      }

      orderItems.push({
        menuItem: menuItem._id as mongoose.Types.ObjectId,
        name: menuItem.name,
        price,
        quantity,
        subtotal: roundMoney(price * quantity),
      });
    }

    const subtotal = roundMoney(
      orderItems.reduce((sum, item) => sum + item.subtotal, 0)
    );

    const discountAmount = roundMoney(
      (subtotal * parsedDiscount) / 100
    );

    const taxableAmount = roundMoney(subtotal - discountAmount);

    const taxAmount = roundMoney(
      (taxableAmount * TAX_RATE) / 100
    );

    const totalAmount = roundMoney(taxableAmount + taxAmount);

    // The authentication middleware stores identity in req.auth.
    const auth = (req as AuthenticatedRequest).auth;
    const createdBy = auth?.userId;

    if (
      !createdBy ||
      !mongoose.Types.ObjectId.isValid(createdBy)
    ) {
      res.status(401).json({
        success: false,
        message: "Unable to identify the authenticated user.",
      });
      return;
    }

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      orderType,
      ...(orderType === "dine-in"
        ? { tableNumber: parsedTableNumber }
        : {}),
      items: orderItems,
      subtotal,
      discountPercent: parsedDiscount,
      discountAmount,
      taxRate: TAX_RATE,
      taxAmount,
      totalAmount,
      status: "pending",
      paymentStatus: "unpaid",
      createdBy,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully.",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create order.",
    });
  }
};

// Retrieve all orders.
export const getOrders = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const orders = await Order.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders.",
    });
  }
};

// Update order status.
export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;

    const validStatuses: OrderStatus[] = [
      "pending",
      "preparing",
      "ready",
      "completed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
      return;
    }

    const orderId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
      return;
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update order status.",
    });
  }
};

// Update payment status.
export const updatePaymentStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { paymentStatus, paymentMethod } = req.body;

    const validPaymentStatuses: PaymentStatus[] = [
      "unpaid",
      "paid",
      "refunded",
    ];

    const validPaymentMethods = ["cash", "card", "upi"];

    if (!validPaymentStatuses.includes(paymentStatus)) {
      res.status(400).json({
        success: false,
        message: "Invalid payment status.",
      });
      return;
    }

    if (
        paymentMethod !== undefined &&
        !validPaymentMethods.includes(paymentMethod)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid payment method. Use cash, card, or upi.",
      });
      return;
    }

    const orderId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
      return;
    }

    const updates:{
        paymentStatus: PaymentStatus;
        paymentMethod?: "cash" | "card" | "upi"
    } = { paymentStatus };

    if (paymentMethod !== undefined) {
        updates.paymentMethod = paymentMethod;
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Update payment status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update payment status.",
    });
  }
};

// Permanently delete an order. The route should restrict this to admins.
export const deleteOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const orderId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
      return;
    }

    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      res.status(404).json({
        success: false,
        message: "Order not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully.",
      orderId: String(deletedOrder._id),
    });
  } catch (error) {
    console.error("Delete order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete order.",
    });
  }
};
