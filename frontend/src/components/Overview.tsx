
type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Ready"
  | "Completed"
  | "Cancelled";

type Order = {
  id: string;
  table: string;
  items: number;
  amount: number;
  status: OrderStatus;
  time: string;
};

type OverviewProps = {
  orders: Order[];
  money: (amount: number) => string;
  onNavigate: (section: "New order" | "Orders") => void;
  onChangeStatus: (id: string) => void;
};

export default function Overview({
  orders,
  money,
  onNavigate,
  onChangeStatus,
}: OverviewProps) {
  const completedSales = orders
    .filter((order) => order.status === "Completed")
    .reduce((sum, order) => sum + order.amount, 0);

  const inProgress = orders.filter((order) =>
    ["Pending", "Preparing"].includes(order.status)
  ).length;

  const readyOrders = orders.filter(
    (order) => order.status === "Ready"
  ).length;

  const serviceStatuses = [
    {
      status: "Pending",
      description: "Waiting for kitchen",
      icon: "◷",
    },
    {
      status: "Preparing",
      description: "Being prepared",
      icon: "⌁",
    },
    {
      status: "Ready",
      description: "Ready for pickup",
      icon: "✓",
    },
  ] as const;

  return (
    <>
      <section className="welcome-row">
        <div>
          <div className="eyebrow">RESTAURANT SERVICE BRIEF</div>
          <h1>A good day to serve.</h1>
          <p className="page-description">
            Here&apos;s what&apos;s happening in your restaurant today.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => onNavigate("New order")}
        >
          ＋ Create an order
        </button>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <div className="metric-top">
            <span>Completed order sales</span>
            <span className="metric-icon green">₹</span>
          </div>
          <div className="metric-value">{money(completedSales)}</div>
          <div className="metric-foot">
            <span className="metric-dot" />
            Completed orders
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>Orders today</span>
            <span className="metric-icon cream">↗</span>
          </div>
          <div className="metric-value">
            {String(orders.length).padStart(2, "0")}
          </div>
          <div className="metric-foot">All order statuses</div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>In progress</span>
            <span className="metric-icon orange">◷</span>
          </div>
          <div className="metric-value">
            {String(inProgress).padStart(2, "0")}
          </div>
          <div className="metric-foot">
            Pending or being prepared
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>Ready to serve</span>
            <span className="metric-icon blue">✓</span>
          </div>
          <div className="metric-value">
            {String(readyOrders).padStart(2, "0")}
          </div>
          <div className="metric-foot">
            Awaiting service or pickup
          </div>
        </article>
      </section>

      <section className="content-grid">
        <div className="panel orders-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent orders</h2>
              <p>Your current service queue</p>
            </div>

            <button
              className="text-button"
              onClick={() => onNavigate("Orders")}
            >
              View all →
            </button>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>TABLE / TYPE</th>
                  <th>ITEMS</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong className="order-id">
                        #{order.id}
                      </strong>
                      <span className="cell-sub">{order.time}</span>
                    </td>

                    <td>{order.table}</td>
                    <td>{order.items} items</td>

                    <td className="amount-cell">
                      {money(order.amount)}
                    </td>

                    <td>
                      <span
                        className={`status status-${String(order.status ?? "pending").toLowerCase()}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td>
                      {["Pending", "Preparing", "Ready"].includes(
                        order.status
                      ) && (
                        <button
                          className="row-action"
                          onClick={() => onChangeStatus(order.id)}
                          aria-label={`Advance order ${order.id} status`}
                        >
                          →
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        No orders yet.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel service-panel">
          <div className="panel-heading">
            <div>
              <h2>Service overview</h2>
              <p>Kitchen &amp; floor snapshot</p>
            </div>
            <span className="live-tag">LIVE</span>
          </div>

          {serviceStatuses.map((item) => (
            <div className="service-stat" key={item.status}>
              <div
                className={`service-stat-icon ${item.status.toLowerCase()}`}
              >
                {item.icon}
              </div>

              <div className="service-stat-copy">
                <strong>
                  {orders.filter(
                    (order) => order.status === item.status
                  ).length}{" "}
                  orders
                </strong>
                <span>{item.description}</span>
              </div>

              <button
                className="service-arrow"
                onClick={() => onNavigate("Orders")}
                aria-label={`View ${item.status} orders`}
              >
                →
              </button>
            </div>
          ))}

          <button
            className="secondary-button full-button"
            onClick={() => onNavigate("Orders")}
          >
            Manage order queue
          </button>
        </div>
      </section>

      <section className="bottom-note">
        <div className="note-symbol">✳</div>

        <div>
          <strong>Small details make great service.</strong>
          <p>
            Keep your kitchen queue moving and every table taken care of.
          </p>
        </div>

        <button onClick={() => onNavigate("New order")}>
          Start an order →
        </button>
      </section>
    </>
  );
}
