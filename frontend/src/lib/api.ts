
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export type OrderType = "dine-in" | "takeaway" | "delivery";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  isAvailable?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  menuItem: string | { _id: string; name?: string };
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface RestaurantOrder {
  _id: string;
  orderNumber: string;
  orderType?: OrderType;
  tableNumber?: number;
  items: OrderItem[];
  subtotal?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: "cash" | "card" | "upi";
  createdBy?: string | { _id: string; name?: string; email?: string };
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderInput {
  orderType: OrderType;
  tableNumber?: number;
  discountPercent?: number;
  items: {
    menuItemId: string;
    quantity: number;
  }[];
}

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

let authToken: string | null = null;
let currentUser: AuthUser | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export function getCurrentUser(): AuthUser | null {
  return currentUser;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const responseText = await response.text();
  let result: unknown = {};

  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error("The server returned an invalid response.");
    }
  }

  if (!response.ok) {
    const errorData = result as {
      message?: string;
      error?: string;
    };

    throw new Error(
      errorData.message ||
        errorData.error ||
        `Request failed with status ${response.status}.`,
    );
  }

  return result as T;
}

function unwrapData<T>(result: T | ApiEnvelope<T>): T {
  if (
    typeof result === "object" &&
    result !== null &&
    "data" in result &&
    result.data !== undefined
  ) {
    return result.data as T;
  }

  return result as T;
}

function unwrapItem<T>(result: T | { item: T }): T {
  if (
    typeof result === "object" &&
    result !== null &&
    "item" in result
  ) {
    return result.item;
  }

  return result as T;
}

function unwrapOrder(
  result:
    | RestaurantOrder
    | { order: RestaurantOrder }
    | ApiEnvelope<RestaurantOrder | { order: RestaurantOrder }>,
): RestaurantOrder {
  const payload = unwrapData(result);

  if (
    typeof payload === "object" &&
    payload !== null &&
    "order" in payload
  ) {
    return payload.order as RestaurantOrder;
  }

  return payload as RestaurantOrder;
}

// Authentication

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const result = await apiRequest<
    LoginResponse | ApiEnvelope<LoginResponse>
  >("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const payload = unwrapData(result);

  if (!payload?.token || !payload?.user?.id || !payload?.user?.name) {
    throw new Error(
      "Login response is missing the authentication token or user details.",
    );
  }

  setAuthToken(payload.token);
  currentUser = payload.user;

  return payload;
}

export function logout(): void {
  setAuthToken(null);
  currentUser = null;
}

// Menu management

export async function getMenuItems(): Promise<MenuItem[]> {
  const result = await apiRequest<
    | MenuItem[]
    | {
        items?: MenuItem[];
        menuItems?: MenuItem[];
      }
    | ApiEnvelope<
        | MenuItem[]
        | {
            items?: MenuItem[];
            menuItems?: MenuItem[];
          }
      >
  >("/menu");

  const payload = unwrapData(result);

  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.items ?? payload.menuItems ?? [];
}

export async function createMenuItem(
  item: Partial<MenuItem>,
): Promise<MenuItem> {
  const result = await apiRequest<
    MenuItem | { item: MenuItem } | ApiEnvelope<MenuItem | { item: MenuItem }>
  >("/menu", {
    method: "POST",
    body: JSON.stringify(item),
  });

  return unwrapItem(unwrapData(result));
}

export async function updateMenuItem(
  id: string,
  item: Partial<MenuItem>,
): Promise<MenuItem> {
  const result = await apiRequest<
    MenuItem | { item: MenuItem } | ApiEnvelope<MenuItem | { item: MenuItem }>
  >(`/menu/${id}`, {
    method: "PUT",
    body: JSON.stringify(item),
  });

  return unwrapItem(unwrapData(result));
}

export async function deleteMenuItem(id: string): Promise<void> {
  await apiRequest<unknown>(`/menu/${id}`, {
    method: "DELETE",
  });
}

export async function deactivateMenuItem(id: string): Promise<void> {
  await apiRequest<unknown>(`/menu/${id}/deactivate`, {
    method: "PATCH",
  });
}

// Orders

export async function getOrders(): Promise<RestaurantOrder[]> {
  const result = await apiRequest<
    | RestaurantOrder[]
    | { orders?: RestaurantOrder[] }
    | ApiEnvelope<RestaurantOrder[] | { orders?: RestaurantOrder[] }>
  >("/orders");

  const payload = unwrapData(result);

  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.orders ?? [];
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<RestaurantOrder> {
  const result = await apiRequest<
    | RestaurantOrder
    | { order: RestaurantOrder }
    | ApiEnvelope<RestaurantOrder | { order: RestaurantOrder }>
  >("/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return unwrapOrder(result);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<RestaurantOrder> {
  const result = await apiRequest<
    | RestaurantOrder
    | { order: RestaurantOrder }
    | ApiEnvelope<RestaurantOrder | { order: RestaurantOrder }>
  >(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return unwrapOrder(result);
}


export async function updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus,
  paymentMethod?: "cash" | "card" | "upi"
): Promise<RestaurantOrder> {
  const result = await apiRequest<
    RestaurantOrder | { order: RestaurantOrder }
  >(`/orders/${encodeURIComponent(id)}/payment`, {
    method: "PATCH",
    body: JSON.stringify({
      paymentStatus,
      ...(paymentMethod ? { paymentMethod } : {}),
    }),
  });

  return unwrapOrder(result);
}

export async function deleteOrder(id: string): Promise<void> {
  await apiRequest<unknown>(`/orders/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
