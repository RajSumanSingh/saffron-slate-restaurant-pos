
"use client";

import { useEffect, useMemo, useState } from "react";

import LoginScreen from "@/components/LoginScreen";
import Sidebar from "@/components/Sidebar";
import Overview from "@/components/Overview";
import POSScreen from "@/components/POSScreen";
import OrdersScreen from "@/components/OrdersScreen";
import MenuManagement from "@/components/MenuManagement";
import MenuModal, { type MenuFormData } from "@/components/MenuModal";

import {
  login,
  logout,
  getCurrentUser,
  getMenuItems as fetchMenuItems,
  createMenuItem as createApiMenuItem,
  updateMenuItem as updateApiMenuItem,
  deactivateMenuItem as deactivateApiMenuItem,
  getOrders,
  createOrder as createApiOrder,
  updateOrderStatus as updateApiOrderStatus,
  updatePaymentStatus as updateApiPaymentStatus,
  type PaymentStatus,
  deleteOrder,
  type AuthUser,
  type MenuItem as ApiMenuItem,
  type OrderStatus as ApiOrderStatus,
  type RestaurantOrder,
} from "@/lib/api";

type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Ready"
  | "Completed"
  | "Cancelled";

type OrderType = "Dine In" | "Takeaway" | "Delivery";

type Section = "Overview" | "New order" | "Orders" | "Menu";

type MenuItem = {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  image: string;
  available: boolean;
  active: boolean;
};

type Order = {
  id: string;
  dbId?: string;
  table: string;
  type: OrderType;
  items: number;
  amount: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: "cash" | "card" | "upi";
  time: string;
  orderItems?: {
    menuItem: string;
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
};

const initialMenuItems: MenuItem[] = [
  {
    id: "m1",
    name: "Paneer Tikka",
    category: "Starters",
    price: 280,
    image: "/images/paneer-tikka.jpg",
    available: true,
    active: true,
  },
  {
    id: "m2",
    name: "Butter Chicken",
    category: "Main course",
    price: 380,
    image: "/images/butter-chicken.jpg",
    available: true,
    active: true,
  },
  {
    id: "m3",
    name: "Dal Makhani",
    category: "Main course",
    price: 240,
    image: "/images/dal-makhani.jpg",
    available: true,
    active: true,
  },
  {
    id: "m4",
    name: "Masala Dosa",
    category: "South Indian",
    price: 180,
    image: "/images/masala-dosa.jpg",
    available: true,
    active: true,
  },
  {
    id: "m5",
    name: "Veg Biryani",
    category: "Rice",
    price: 260,
    image: "/images/veg-biryani.jpg",
    available: true,
    active: true,
  },
  {
    id: "m6",
    name: "Fresh Lime Soda",
    category: "Beverages",
    price: 90,
    image: "/images/lime-soda.jpg",
    available: true,
    active: true,
  },
];

const initialOrders: Order[] = [
  {
    id: "1048",
    table: "T-04",
    type: "Dine In",
    items: 3,
    amount: 840,
    status: "Preparing",
    time: "2 min ago",
  },
  {
    id: "1047",
    table: "T-02",
    type: "Dine In",
    items: 2,
    amount: 460,
    status: "Ready",
    time: "5 min ago",
  },
  {
    id: "1046",
    table: "T-08",
    type: "Dine In",
    items: 4,
    amount: 1260,
    status: "Preparing",
    time: "8 min ago",
  },
  {
    id: "1045",
    table: "T-01",
    type: "Dine In",
    items: 1,
    amount: 220,
    status: "Completed",
    time: "12 min ago",
  },
  {
    id: "1044",
    table: "T-06",
    type: "Dine In",
    items: 2,
    amount: 590,
    status: "Pending",
    time: "15 min ago",
  },
];

const emptyMenuForm: MenuFormData = {
  name: "",
  description: "",
  category: "Main course",
  price: "",
  image: "/images/paneer-tikka.jpg",
};

const money = (amount: number) =>
  amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

function imageForItem(name: string) {
  return (
    initialMenuItems.find(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    )?.image ?? "/images/paneer-tikka.jpg"
  );
}

function fromApiItem(item: ApiMenuItem): MenuItem {
  return {
    id: item._id,
    name: item.name,
    description: item.description ?? "",
    category: item.category,
    price: item.price,
    image: imageForItem(item.name),
    available: Boolean(item.isAvailable),
    active: Boolean(item.isActive),
  };
}

function mapApiStatus(status: ApiOrderStatus): OrderStatus {
  const map: Record<ApiOrderStatus, OrderStatus> = {
    pending: "Pending",
    preparing: "Preparing",
    ready: "Ready",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return map[status];
}

function mapUiStatus(status: OrderStatus): ApiOrderStatus {
  const map: Record<OrderStatus, ApiOrderStatus> = {
    Pending: "pending",
    Preparing: "preparing",
    Ready: "ready",
    Completed: "completed",
    Cancelled: "cancelled",
  };

  return map[status];
}

function mapApiOrderType(type?: RestaurantOrder["orderType"]): OrderType {
  if (type === "takeaway") return "Takeaway";
  if (type === "delivery") return "Delivery";
  return "Dine In";
}

function mapUiOrderType(type: OrderType) {
  if (type === "Takeaway") return "takeaway" as const;
  if (type === "Delivery") return "delivery" as const;
  return "dine-in" as const;
}

function fromApiOrder(order: RestaurantOrder): Order {
  const type = mapApiOrderType(order.orderType);

  return {
    id: order.orderNumber || order._id,
    dbId: order._id,
    table:
      type === "Dine In"
        ? `T-${String(order.tableNumber ?? 1).padStart(2, "0")}`
        : type,
    type,
    items: order.items.reduce((sum, item) => sum + item.quantity, 0),
    amount: order.totalAmount,
    status: mapApiStatus(order.status),
    paymentStatus: order.paymentStatus ?? "unpaid",
    paymentMethod: order.paymentMethod,
    time: new Date(order.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    orderItems: order.items.map((item) => ({
      menuItem:
        typeof item.menuItem === "string"
          ? item.menuItem
          : item.menuItem._id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
  };
}

export default function Home() {
  const [section, setSection] = useState<Section>("Overview");
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [menuCategory, setMenuCategory] = useState("All");

  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [menuForm, setMenuForm] = useState<MenuFormData>(emptyMenuForm);

  const [table, setTable] = useState("1");
  const [orderType, setOrderType] = useState<OrderType>("Dine In");
  const [discount, setDiscount] = useState("0");

  const [notice, setNotice] = useState("");
  const [user, setUser] = useState<AuthUser | null>(getCurrentUser());
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [menuLoading, setMenuLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadMenu() {
      setMenuLoading(true);

      try {
        const items = await fetchMenuItems();

        if (!cancelled) {
          setMenuItems(items.map(fromApiItem));
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(
            error instanceof Error
              ? `Could not load the server menu: ${error.message}`
              : "Could not load the server menu."
          );
        }
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    }

    async function loadSavedOrders() {
      try {
        const savedOrders = await getOrders();

        if (!cancelled) {
          setOrders(savedOrders.map(fromApiOrder));
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(
            error instanceof Error
              ? `Could not load orders: ${error.message}`
              : "Could not load orders."
          );
        }
      }
    }

    void loadMenu();
    void loadSavedOrders();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          menuItems
            .filter((item) => item.active)
            .map((item) => item.category)
        )
      ),
    ],
    [menuItems]
  );

  void categories;

  const cartCount = Object.values(cart).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  const subtotal = menuItems.reduce(
    (sum, item) => sum + item.price * (cart[item.id] || 0),
    0
  );

  // The backend allows discounts up to 15%.
  const discountPercent = Math.min(15, Math.max(0, Number(discount) || 0));
  const discountAmount = Math.round(subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const tax = Math.round(taxableAmount * 0.05 * 100) / 100;
  const total = taxableAmount + tax;

  function handleSectionChange(nextSection: Section) {
    setSection(nextSection);
    setNotice("");
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await login(loginEmail, loginPassword);
      const authenticatedUser = response.user;

      setUser(authenticatedUser);
      setSection("Overview");
      setNotice(`Welcome back, ${authenticatedUser.name}.`);
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
    setLoginPassword("");
    setLoginError("");
    setNotice("");
    setCart({});
    setOrders(initialOrders);
    setMenuItems(initialMenuItems);
    setSection("Overview");
  }

  function addToCart(id: string) {
    const item = menuItems.find((entry) => entry.id === id);

    if (!item || !item.active || !item.available) return;

    setCart((current) => ({
      ...current,
      [id]: (current[id] || 0) + 1,
    }));

    setNotice("");
  }

  function updateQuantity(id: string, amount: number) {
    setCart((current) => {
      const nextQuantity = (current[id] || 0) + amount;
      const next = { ...current };

      if (nextQuantity <= 0) {
        delete next[id];
      } else {
        next[id] = nextQuantity;
      }

      return next;
    });
  }

  async function changeStatus(id: string) {
    const order = orders.find(
      (item) => item.id === id || item.dbId === id
    );

    if (!order) return;

    const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
      Pending: "Preparing",
      Preparing: "Ready",
      Ready: "Completed",
    };

    const next = nextStatus[order.status];

    if (!next) return;

    if (!order.dbId) {
      setNotice(
        "This is sample order data. Only orders saved in the database can be updated."
      );
      return;
    }

    try {
      const updated = await updateApiOrderStatus(
        order.dbId,
        mapUiStatus(next)
      );

      setOrders((current) =>
        current.map((item) =>
          item.dbId === order.dbId ? fromApiOrder(updated) : item
        )
      );

      setNotice(`Order #${order.id} updated to ${next}.`);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Could not update order status: ${error.message}`
          : "Could not update order status."
      );
    }
  }


  
async function handleDeleteOrder(id: string) {
  try {
    await deleteOrder(id);

    setOrders((currentOrders) =>
      currentOrders.filter(
        (order) => order.dbId !== id && order.id !== id
      )
    );

    setNotice("Order deleted successfully.");
  } catch (error) {
    setNotice(
      error instanceof Error
        ? error.message
        : "Failed to delete order. Please try again."
    );
  }
}
async function handleUpdatePayment(
  id: string,
  paymentStatus: PaymentStatus,
  paymentMethod: "cash" | "card" | "upi"
) {
  try {
    const updated = await updateApiPaymentStatus(
      id,
      paymentStatus,
      paymentMethod
    );

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.dbId === updated._id
          ? fromApiOrder(updated)
          : order
      )
    );

    setNotice(
      `Payment for order #${updated.orderNumber} saved successfully.`
    );
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Could not save payment. Please try again.");
  }
}


  function openAddMenuItem() {
    setEditingMenuId(null);
    setMenuForm({ ...emptyMenuForm });
    setMenuModalOpen(true);
    setNotice("");
  }

  function openEditMenuItem(id: string) {
    const item = menuItems.find((entry) => entry.id === id);

    if (!item) return;

    setEditingMenuId(item.id);
    setMenuForm({
      name: item.name,
      description: item.description ?? "",
      category: item.category,
      price: String(item.price),
      image: item.image,
    });
    setMenuModalOpen(true);
    setNotice("");
  }

  function handleMenuFormChange(
    field: keyof MenuFormData,
    value: string
  ) {
    setMenuForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveMenuItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = menuForm.name.trim();
    const categoryName = menuForm.category.trim();
    const price = Number(menuForm.price);
    const description = menuForm.description.trim();

    if (
      !name ||
      !categoryName ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setNotice("Enter a name, category, and a price greater than zero.");
      return;
    }

    const duplicate = menuItems.some(
      (item) =>
        item.active &&
        item.name.toLowerCase() === name.toLowerCase() &&
        item.id !== editingMenuId
    );

    if (duplicate) {
      setNotice("An active menu item with this name already exists.");
      return;
    }

    setMenuLoading(true);

    try {
      if (editingMenuId) {
        const updated = await updateApiMenuItem(editingMenuId, {
          name,
          category: categoryName,
          price,
          description,
        });

        setMenuItems((current) =>
          current.map((item) =>
            item.id === editingMenuId
              ? {
                  ...item,
                  ...fromApiItem(updated),
                  image: menuForm.image || imageForItem(name),
                }
              : item
          )
        );

        setNotice(`${name} updated successfully.`);
      } else {
        const created = await createApiMenuItem({
          name,
          category: categoryName,
          price,
          description,
        });

        setMenuItems((current) => [
          ...current,
          {
            ...fromApiItem(created),
            image: menuForm.image || imageForItem(name),
          },
        ]);

        setNotice(`${name} added successfully.`);
      }

      setMenuModalOpen(false);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Could not save menu item: ${error.message}`
          : "Could not save menu item."
      );
    } finally {
      setMenuLoading(false);
    }
  }

  async function toggleMenuAvailability(id: string) {
    const item = menuItems.find((entry) => entry.id === id);

    if (!item) return;

    try {
      const updated = await updateApiMenuItem(id, {
        isAvailable: !item.available,
      });

      setMenuItems((current) =>
        current.map((entry) =>
          entry.id === id
            ? { ...entry, ...fromApiItem(updated) }
            : entry
        )
      );

      setNotice(
        `${item.name} is now ${
          !item.available ? "available" : "unavailable"
        }.`
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Could not update availability: ${error.message}`
          : "Could not update availability."
      );
    }
  }

  async function deactivateMenuItem(id: string) {
    const item = menuItems.find((entry) => entry.id === id);

    if (!item) return;

    try {
      await deactivateApiMenuItem(id);

      setMenuItems((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, active: false } : entry
        )
      );

      setCart((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      setNotice(`${item.name} deactivated successfully.`);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Could not deactivate item: ${error.message}`
          : "Could not deactivate menu item."
      );
    }
  }

  async function placeOrder() {
    if (cartCount === 0) {
      setNotice("Add at least one available dish before placing an order.");
      return;
    }

    const tableNumber = Number(table);

    if (
      orderType === "Dine In" &&
      (!Number.isInteger(tableNumber) || tableNumber < 1)
    ) {
      setNotice("Enter a valid table number.");
      return;
    }

    const items = Object.entries(cart)
      .filter(([, quantity]) => quantity > 0)
      .map(([menuItemId, quantity]) => ({
        menuItemId,
        quantity,
      }));

    setOrderLoading(true);

    try {
      const savedOrder = await createApiOrder({
        orderType: mapUiOrderType(orderType),
        ...(orderType === "Dine In" ? { tableNumber } : {}),
        discountPercent,
        items,
      });

      const newOrder = fromApiOrder(savedOrder);

      setOrders((current) => [
        newOrder,
        ...current.filter((item) => item.dbId !== newOrder.dbId),
      ]);

      setCart({});
      setDiscount("0");
      setNotice(
        `Order #${savedOrder.orderNumber} saved. Server-calculated total: ${money(
          savedOrder.totalAmount
        )}.`
      );
      setSection("Orders");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Could not place order: ${error.message}`
          : "Could not place order."
      );
    } finally {
      setOrderLoading(false);
    }
  }

  if (!user) {
    return (
      <LoginScreen
        email={loginEmail}
        password={loginPassword}
        loading={loginLoading}
        error={loginError}
        onEmailChange={setLoginEmail}
        onPasswordChange={setLoginPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <div className="pos-shell">
      <Sidebar
        section={section}
        onSectionChange={handleSectionChange}
        userName={user.name}
        userRole={user.role === "admin" ? "Administrator" : "Staff"}
        onLogout={handleLogout}
      />

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{section}</strong>
          </div>

          <div className="topbar-right">
            <span className="date-label">Restaurant POS</span>
            <div className="top-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="page-content">
          {notice && (
            <div className="notice" role="status">
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          )}

          {(menuLoading || orderLoading) && (
            <p className="muted-label" role="status">
              {orderLoading
                ? "Saving order…"
                : "Syncing menu with the server…"}
            </p>
          )}

          {section === "Overview" && (
            <Overview
              orders={orders}
              money={money}
              onNavigate={(nextSection) =>
                handleSectionChange(nextSection)
              }
              onChangeStatus={changeStatus}
            />
          )}

          {section === "New order" && (
            <POSScreen
              menuItems={menuItems}
              cart={cart}
              category={category}
              search={search}
              table={table}
              orderType={orderType}
              discount={discount}
              money={money}
              onCategoryChange={setCategory}
              onSearchChange={setSearch}
              onTableChange={setTable}
              onOrderTypeChange={setOrderType}
              onDiscountChange={setDiscount}
              onAddToCart={addToCart}
              onUpdateQuantity={updateQuantity}
              onPlaceOrder={placeOrder}
              orderLoading={orderLoading}
            />
          )}

          {section === "Orders" && (
            <OrdersScreen
              orders={orders}
              money={money}
              onChangeStatus={changeStatus}
              onDeleteOrder={handleDeleteOrder}
              onUpdatePayment={handleUpdatePayment}
              canManagePayments={user.role === "admin"}

            />
          )}

          {section === "Menu" && (
            <MenuManagement
              menuItems={menuItems}
              search={menuSearch}
              category={menuCategory}
              money={money}
              onSearchChange={setMenuSearch}
              onCategoryChange={setMenuCategory}
              onAddItem={openAddMenuItem}
              onEditItem={openEditMenuItem}
              onToggleAvailability={toggleMenuAvailability}
              onDeactivateItem={deactivateMenuItem}
            />
          )}

          <MenuModal
            isOpen={menuModalOpen}
            editing={editingMenuId !== null}
            form={menuForm}
            onFormChange={handleMenuFormChange}
            onClose={() => setMenuModalOpen(false)}
            onSubmit={saveMenuItem}
          />

          <footer className="page-footer">
            <span>
              SAFFRON &amp; SLATE{" "}
              <span className="footer-dot">·</span> RESTAURANT OPERATIONS
            </span>
            <span>Thoughtful service, one order at a time.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
