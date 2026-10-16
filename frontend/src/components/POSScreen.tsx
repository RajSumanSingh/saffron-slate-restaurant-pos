"use client";

type OrderType = "Dine In" | "Takeaway" | "Delivery";

type MenuItem = {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  image?: string;
  available: boolean;
  active: boolean;
};

interface POSScreenProps {
  menuItems: MenuItem[];
  cart: Record<string, number>;
  category: string;
  search: string;
  table: string;
  orderType: OrderType;
  discount: string;
  money: (amount: number) => string;
  onCategoryChange: (category: string) => void;
  onSearchChange: (search: string) => void;
  onTableChange: (table: string) => void;
  onOrderTypeChange: (type: OrderType) => void;
  onDiscountChange: (discount: string) => void;
  onAddToCart: (id: string) => void;
  onUpdateQuantity: (id: string, amount: number) => void;
  onPlaceOrder: () => void | Promise<void>;
  orderLoading?: boolean;
}

export default function POSScreen({
  menuItems,
  cart,
  category,
  search,
  table,
  orderType,
  discount,
  money,
  onCategoryChange,
  onSearchChange,
  onTableChange,
  onOrderTypeChange,
  onDiscountChange,
  onAddToCart,
  onUpdateQuantity,
  onPlaceOrder,
  orderLoading = false,
}: POSScreenProps) {
  const categories = [
    "All",
    ...Array.from(new Set(menuItems.map((item) => item.category))),
  ];

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      category === "All" || item.category === category;

    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch && item.active;
  });

  const cartItems = menuItems
    .filter((item) => (cart[item.id] ?? 0) > 0)
    .map((item) => ({
      ...item,
      quantity: cart[item.id],
    }));

  const itemCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const discountPercent = Math.min(
    15,
    Math.max(0, Number(discount) || 0),
  );

  const discountAmount = Math.round(
    (subtotal * discountPercent) / 100,
  );

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = Math.round(taxableAmount * 0.05);
  const total = taxableAmount + taxAmount;

  return (
    <div className="pos-layout">
      <section className="pos-menu-panel">
        <div className="page-heading">
          <div>
            <p className="eyebrow">RESTAURANT OPERATIONS</p>
            <h1>New Order</h1>
            <p>Select menu items to build an order.</p>
          </div>

          <span className="status-badge">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="pos-search">
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search dishes..."
            aria-label="Search menu items"
          />
        </div>

        <div className="category-list">
          {categories.map((itemCategory) => (
            <button
              key={itemCategory}
              type="button"
              className={
                category === itemCategory
                  ? "category-button active"
                  : "category-button"
              }
              onClick={() => onCategoryChange(itemCategory)}
            >
              {itemCategory}
            </button>
          ))}
        </div>

        <div className="pos-menu-grid">
          {filteredItems.map((item) => {
            const quantity = cart[item.id] ?? 0;
            const isAvailable = item.available;

            return (
              <article className="pos-menu-card" key={item.id}>
                {item.image ? (
                  <img
                    className="pos-menu-image"
                    src={item.image}
                    alt={item.name}
                  />
                ) : (
                  <div className="pos-menu-image-placeholder">
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="pos-menu-card-content">
                  <p className="menu-item-category">{item.category}</p>
                  <h3>{item.name}</h3>

                  {item.description && (
                    <p className="menu-item-description">
                      {item.description}
                    </p>
                  )}

                  <div className="pos-menu-card-footer">
                    <strong>{money(item.price)}</strong>

                    <button
                      type="button"
                      className="add-item-button"
                      disabled={!isAvailable}
                      onClick={() => onAddToCart(item.id)}
                    >
                      {!isAvailable
                        ? "Unavailable"
                        : quantity > 0
                          ? `Add more (${quantity})`
                          : "＋ Add"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="pos-empty-state">
              <h3>No menu items found</h3>
              <p>Try another search or category.</p>
            </div>
          )}
        </div>
      </section>

      <aside className="pos-cart-panel">
        <div className="pos-cart-heading">
          <div>
            <p className="eyebrow">CURRENT SALE</p>
            <h2>Order Details</h2>
          </div>

          <span className="cart-count">{itemCount}</span>
        </div>

        <div className="order-type-selector">
          <label htmlFor="order-type">Order type</label>

          <select
            id="order-type"
            value={orderType}
            onChange={(event) =>
              onOrderTypeChange(event.target.value as OrderType)
            }
          >
            <option value="Dine In">Dine In</option>
            <option value="Takeaway">Takeaway</option>
            <option value="Delivery">Delivery</option>
          </select>
        </div>

        {orderType === "Dine In" && (
          <div className="table-selector">
            <label htmlFor="table-number">Table number</label>

            <select
              id="table-number"
              value={table}
              onChange={(event) => onTableChange(event.target.value)}
            >
              {Array.from({ length: 20 }, (_, index) => index + 1).map(
                (tableNumber) => (
                  <option key={tableNumber} value={String(tableNumber)}>
                    Table {tableNumber}
                  </option>
                ),
              )}
            </select>
          </div>
        )}

        <div className="pos-cart-items">
          {cartItems.map((item) => (
            <div className="pos-cart-item" key={item.id}>
              <div className="pos-cart-item-info">
                <h4>{item.name}</h4>
                <p>
                  {money(item.price)} × {item.quantity}
                </p>
                <strong>{money(item.price * item.quantity)}</strong>
              </div>

              <div className="quantity-controls">
                <button
                  type="button"
                  aria-label={`Remove one ${item.name}`}
                  onClick={() => onUpdateQuantity(item.id, -1)}
                >
                  −
                </button>

                <span>{item.quantity}</span>

                <button
                  type="button"
                  aria-label={`Add one ${item.name}`}
                  onClick={() => onUpdateQuantity(item.id, 1)}
                >
                  +
                </button>
              </div>
            </div>
          ))}

          {cartItems.length === 0 && (
            <div className="pos-cart-empty">
              <span className="empty-cart-icon">＋</span>
              <h3>Your order is empty</h3>
              <p>Select dishes from the menu to get started.</p>
            </div>
          )}
        </div>

        <div className="billing-section">
          <div className="discount-selector">
            <label htmlFor="discount">Discount</label>

            <select
              id="discount"
              value={discount}
              onChange={(event) => onDiscountChange(event.target.value)}
            >
              <option value="0">No discount</option>
              <option value="5">5% discount</option>
              <option value="10">10% discount</option>
              <option value="15">15% discount</option>
            </select>
          </div>

          <div className="billing-row">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>

          <div className="billing-row">
            <span>Discount ({discountPercent}%)</span>
            <span>− {money(discountAmount)}</span>
          </div>

          <div className="billing-row">
            <span>Tax (5%)</span>
            <span>{money(taxAmount)}</span>
          </div>

          <div className="billing-total">
            <span>Total Amount</span>
            <strong>{money(total)}</strong>
          </div>

          <button
            type="button"
            className="place-order-button"
            disabled={itemCount === 0 || orderLoading}
            onClick={() => void onPlaceOrder()}
          >
            {orderLoading ? "Saving Order..." : "Place Order →"}
          </button>

          <p className="billing-note">
            Tax and discount are calculated automatically.
          </p>
        </div>
      </aside>
    </div>
  );
}