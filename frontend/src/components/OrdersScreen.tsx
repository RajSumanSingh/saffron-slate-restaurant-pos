
"use client";

import { Fragment, useState } from "react";

type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Ready"
  | "Completed"
  | "Cancelled";

type PaymentStatus = "unpaid" | "paid" | "refunded";
type PaymentMethod = "cash" | "card" | "upi";

type OrderItem = {
  menuItem: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
};

type Order = {
  id: string;
  dbId?: string;
  table: string;
  type?: "Dine In" | "Takeaway" | "Delivery";
  items: number;
  amount: number;
  status: OrderStatus;
  time: string;
  orderItems?: OrderItem[];
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
};

type OrdersScreenProps = {
  orders: Order[];
  money: (amount: number) => string;
  onChangeStatus: (id: string) => void;
  onDeleteOrder: (id: string) => Promise<void>;
  onUpdatePayment: (
    id: string,
    paymentStatus: PaymentStatus,
    paymentMethod: PaymentMethod
  ) => Promise<void>;
  canManagePayments: boolean;
};

const statusClasses: Record<OrderStatus, string> = {
  Pending: "status-pending",
  Preparing: "status-preparing",
  Ready: "status-ready",
  Completed: "status-completed",
  Cancelled: "status-cancelled",
};

const paymentLabels: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  refunded: "Refunded",
};

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
];

export default function OrdersScreen({
  orders,
  money,
  onChangeStatus,
  onDeleteOrder,
  onUpdatePayment,
  canManagePayments,
}: OrdersScreenProps) {
  const [expandedOrders, setExpandedOrders] = useState<
    Record<string, boolean>
  >({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const [paymentDrafts, setPaymentDrafts] = useState<
    Record<string, { status: PaymentStatus; method: PaymentMethod }>
  >({});
  const [savingPaymentId, setSavingPaymentId] = useState<string | null>(null);
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>(
    {}
  );
  const [paymentSuccess, setPaymentSuccess] = useState<
    Record<string, string>
  >({});

  const activeOrders = orders.filter(
    (order) => !["Completed", "Cancelled"].includes(order.status)
  );

  function toggleOrder(orderId: string) {
    setExpandedOrders((current) => ({
      ...current,
      [orderId]: !current[orderId],
    }));
  }

  function getPaymentDraft(order: Order) {
    const key = order.dbId ?? order.id;

    return (
      paymentDrafts[key] ?? {
        status: order.paymentStatus ?? "unpaid",
        method: order.paymentMethod ?? "cash",
      }
    );
  }

  function updatePaymentDraft(
    order: Order,
    field: "status" | "method",
    value: PaymentStatus | PaymentMethod
  ) {
    const key = order.dbId ?? order.id;
    const current = getPaymentDraft(order);

    setPaymentDrafts((drafts) => ({
      ...drafts,
      [key]: { ...current, [field]: value },
    }));

    setPaymentErrors((errors) => ({ ...errors, [key]: "" }));
    setPaymentSuccess((success) => ({ ...success, [key]: "" }));
  }

  async function handleSavePayment(order: Order) {
    const id = order.dbId;
    const key = order.dbId ?? order.id;

    if (!id) {
      setPaymentErrors((errors) => ({
        ...errors,
        [key]: "This order has no database ID. Refresh the orders and try again.",
      }));
      return;
    }

    const draft = getPaymentDraft(order);

    setSavingPaymentId(key);
    setPaymentErrors((errors) => ({ ...errors, [key]: "" }));
    setPaymentSuccess((success) => ({ ...success, [key]: "" }));

    try {
      await onUpdatePayment(id, draft.status, draft.method);

      setPaymentSuccess((success) => ({
        ...success,
        [key]: "Payment saved successfully.",
      }));
    } catch (error) {
      setPaymentErrors((errors) => ({
        ...errors,
        [key]:
          error instanceof Error
            ? error.message
            : "Could not save payment. Please try again.",
      }));
    } finally {
      setSavingPaymentId(null);
    }
  }

  async function handleDelete(order: Order) {
    const id = order.dbId ?? order.id;

    const confirmed = window.confirm(
      `Delete order ${order.id} permanently? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(id);
    setDeleteError("");

    try {
      await onDeleteOrder(id);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Could not delete this order. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="content-section orders-screen">
      <div className="section-heading">
        <div>
          <div className="eyebrow">ORDER MANAGEMENT</div>
          <h1>Orders</h1>
          <p className="section-description">
            Track incoming orders and keep service moving.
          </p>
        </div>

        <div className="heading-stat">
          <span>Active orders</span>
          <strong>{activeOrders.length}</strong>
        </div>
      </div>

      <div className="orders-summary">
        <div className="summary-card">
          <span>Total orders</span>
          <strong>{orders.length}</strong>
        </div>
        <div className="summary-card">
          <span>Pending</span>
          <strong>
            {orders.filter((order) => order.status === "Pending").length}
          </strong>
        </div>
        <div className="summary-card">
          <span>Preparing</span>
          <strong>
            {orders.filter((order) => order.status === "Preparing").length}
          </strong>
        </div>
        <div className="summary-card">
          <span>Ready</span>
          <strong>
            {orders.filter((order) => order.status === "Ready").length}
          </strong>
        </div>
      </div>

      <div className="panel orders-panel">
        <div className="panel-heading">
          <div>
            <h2>All orders</h2>
            <p>Click an order number to view its dishes and quantities.</p>
          </div>
          <span className="muted-label">{orders.length} records</span>
        </div>

        {deleteError && (
          <div className="form-error orders-page-error" role="alert">
            {deleteError}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">≡</span>
            <h3>No orders yet</h3>
            <p>Orders will appear here when they are placed.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Table / Type</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => {
                  const orderKey = order.dbId ?? order.id;
                  const isExpanded = Boolean(expandedOrders[order.id]);
                  const orderItems = order.orderItems ?? [];
                  const isDeleting = deletingId === orderKey;
                  const paymentDraft = getPaymentDraft(order);
                  const isSavingPayment = savingPaymentId === orderKey;

                  return (
                    <Fragment key={orderKey}>
                      <tr className="orders-table-row">
                        <td className="orders-number-cell">
                          <button
                            type="button"
                            className="order-number-toggle"
                            onClick={() => toggleOrder(order.id)}
                            aria-expanded={isExpanded}
                            aria-controls={`order-details-${orderKey}`}
                          >
                            <strong>{order.id}</strong>
                            <span className="order-expand-icon" aria-hidden="true">
                              {isExpanded ? "−" : "+"}
                            </span>
                          </button>
                          <span className="table-subtext">{order.time}</span>
                        </td>

                        <td>
                          <span className="orders-table-primary">
                            {order.table}
                          </span>
                          {order.type && (
                            <span className="table-subtext">{order.type}</span>
                          )}
                        </td>

                        <td>{order.items}</td>
                        <td className="orders-amount-cell">
                          {money(order.amount)}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              statusClasses[order.status] ?? "status-pending"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>

                        <td>
                          <div className="orders-payment-summary">
                            <span
                              className={`payment-badge payment-${order.paymentStatus ?? "unpaid"}`}
                            >
                              {paymentLabels[order.paymentStatus ?? "unpaid"]}
                            </span>
                            {order.paymentMethod && (
                              <span className="table-subtext">
                                {order.paymentMethod.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="order-action-group">
                            {order.status !== "Completed" &&
                            order.status !== "Cancelled" ? (
                              <button
                                type="button"
                                className="table-action"
                                onClick={() => onChangeStatus(order.id)}
                                disabled={isDeleting}
                              >
                                Update status <span aria-hidden="true">→</span>
                              </button>
                            ) : (
                              <span className="muted-label">Finished</span>
                            )}

                            <button
                              type="button"
                              className="table-action order-delete-button"
                              onClick={() => void handleDelete(order)}
                              disabled={isDeleting}
                              aria-label={`Delete order ${order.id}`}
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr
                          id={`order-details-${orderKey}`}
                          className="order-details-row"
                        >
                          <td colSpan={7}>
                            <div className="order-details-content">
                              <div className="order-details-heading">
                                <div>
                                  <div className="eyebrow">ORDER SUMMARY</div>
                                  <h3>Order details</h3>
                                  <p>
                                    {order.table}
                                    {order.type ? ` · ${order.type}` : ""}
                                    {" · "}
                                    {order.items}{" "}
                                    {order.items === 1 ? "item" : "items"}
                                  </p>
                                </div>

                                <div className="order-details-total">
                                  <span>Order total</span>
                                  <strong>{money(order.amount)}</strong>
                                </div>
                              </div>

                              {orderItems.length > 0 ? (
                                <div className="order-items-list">
                                  {orderItems.map((item, index) => (
                                    <div
                                      className="order-item-line"
                                      key={`${item.menuItem}-${index}`}
                                    >
                                      <div className="order-item-name">
                                        <strong>{item.name}</strong>
                                        <span>
                                          {item.quantity} × {money(item.price)}
                                        </span>
                                      </div>
                                      <strong>{money(item.subtotal)}</strong>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="order-details-empty">
                                  Item-level details aren&apos;t available for
                                  this order.
                                </p>
                              )}

                              <div className="payment-management">
                                <div className="payment-section-heading">
                                  <div>
                                    <div className="eyebrow">SETTLEMENT</div>
                                    <h3>Payment recording</h3>
                                  </div>
                                  <span className="payment-current-badge">
                                    {paymentLabels[order.paymentStatus ?? "unpaid"]}
                                  </span>
                                </div>

                                <div className="payment-current-status">
                                  <span>Recorded method</span>
                                  <strong>
                                    {order.paymentMethod
                                      ? paymentMethods.find(
                                          (method) =>
                                            method.value === order.paymentMethod
                                        )?.label
                                      : "Not recorded"}
                                  </strong>
                                </div>

                                {canManagePayments ? (
                                  <div className="payment-form">
                                    <label className="payment-field">
                                      <span>Payment status</span>
                                      <select
                                        value={paymentDraft.status}
                                        onChange={(event) =>
                                          updatePaymentDraft(
                                            order,
                                            "status",
                                            event.target.value as PaymentStatus
                                          )
                                        }
                                        disabled={isSavingPayment}
                                      >
                                        <option value="unpaid">Unpaid</option>
                                        <option value="paid">Paid</option>
                                        <option value="refunded">Refunded</option>
                                      </select>
                                    </label>

                                    <label className="payment-field">
                                      <span>Payment method</span>
                                      <select
                                        value={paymentDraft.method}
                                        onChange={(event) =>
                                          updatePaymentDraft(
                                            order,
                                            "method",
                                            event.target.value as PaymentMethod
                                          )
                                        }
                                        disabled={isSavingPayment}
                                      >
                                        {paymentMethods.map((method) => (
                                          <option
                                            key={method.value}
                                            value={method.value}
                                          >
                                            {method.label}
                                          </option>
                                        ))}
                                      </select>
                                    </label>

                                    <button
                                      type="button"
                                      className="payment-save-button"
                                      onClick={() => void handleSavePayment(order)}
                                      disabled={isSavingPayment}
                                    >
                                      {isSavingPayment ? (
                                        <>
                                          <span className="payment-spinner" />
                                          Saving…
                                        </>
                                      ) : (
                                        "Record payment"
                                      )}
                                    </button>

                                    {paymentErrors[orderKey] && (
                                      <p
                                        className="form-error payment-feedback"
                                        role="alert"
                                      >
                                        {paymentErrors[orderKey]}
                                      </p>
                                    )}

                                    {paymentSuccess[orderKey] && (
                                      <p
                                        className="payment-success payment-feedback"
                                        role="status"
                                      >
                                        {paymentSuccess[orderKey]}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="order-details-empty">
                                    Only an admin can record or update payments.
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
