
import type { Request, Response } from "express";
import mongoose from "mongoose";
import Menu from "../models/Menu.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, category, price } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      
      typeof category !== "string" ||
      !category.trim() ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Valid name, category, and positive price are required",
      });
      return;
    }

    const item = await Menu.create({
      name: name.trim(),
      description:
        typeof description === "string" ? description.trim() : "",
      category: category.trim(),
      price,
    });

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data: item,
    });
  }
);

export const getMenuItems = asyncHandler(
  async (req: Request, res: Response) => {
    const { category, search } = req.query;

    const filter: Record<string, unknown> = {
      isActive: true,
    };

    if (typeof category === "string" && category.trim()) {
      filter.category = category.trim();
    }

    if (typeof search === "string" && search.trim()) {
      filter.name = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    const items = await Menu.find(filter).sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  }
);

export const updateMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
      return;
    }

    const updates = req.body as Record<string, unknown>;
    const allowedFields = [
      "name",
      "description",
      "category",
      "price",
      "isAvailable",
      "isActive",
    ];

    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update",
      });
      return;
    }

    if (
      "name" in updateData &&
      (typeof updateData.name !== "string" ||
        !updateData.name.trim())
    ) {
      res.status(400).json({
        success: false,
        message: "Name must be a non-empty string",
      });
      return;
    }

    if (
      "category" in updateData &&
      (typeof updateData.category !== "string" ||
        !updateData.category.trim())
    ) {
      res.status(400).json({
        success: false,
        message: "Category must be a non-empty string",
      });
      return;
    }

    if (
      "description" in updateData &&
      typeof updateData.description !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Description must be a string",
      });
      return;
    }

    if ("name" in updateData) {
      updateData.name = (updateData.name as string).trim();
    }

    if ("category" in updateData) {
      updateData.category = (updateData.category as string).trim();
    }

    if ("description" in updateData) {
      updateData.description =
        (updateData.description as string).trim();
    }

    if (
      "price" in updateData &&
      (typeof updateData.price !== "number" ||
        !Number.isFinite(updateData.price) ||
        updateData.price <= 0)
    ) {
      res.status(400).json({
        success: false,
        message: "Price must be a positive number",
      });
      return;
    }

    for (const field of ["isAvailable", "isActive"]) {
      if (
        field in updateData &&
        typeof updateData[field] !== "boolean"
      ) {
        res.status(400).json({
          success: false,
          message: `${field} must be a boolean`,
        });
        return;
      }
    }

    const item = await Menu.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      data: item,
    });
  }
);

export const deleteMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
      return;
    }

    const item = await Menu.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!item) {
      res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Menu item deactivated successfully",
    });
  }
);
