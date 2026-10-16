
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import { authenticate, authorize } from "./middleware/authMiddleware.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(helmet());
const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as server-to-server requests.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Restaurant POS API is running",
    database: "connected",
    timestamp: new Date().toISOString(),
  });
});

app.get(
    "/api/admin-test",
    authenticate,
    authorize("admin"),
    (_req, res) => {
      res.status(200).json({
        success: true,
        message: "Admin test successful",
      });
    }
);

app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found",
    });
});

app.use(
    (
        error: unknown,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
    ) => {
        console.error("API error:", error);

        if (res.headersSent) {
            return;
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }

);


async function startServer(): Promise<void> {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Restaurant POS API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

void startServer();
