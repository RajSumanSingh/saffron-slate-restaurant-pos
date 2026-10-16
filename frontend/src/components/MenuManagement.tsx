
"use client";

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

type MenuManagementProps = {
  menuItems: MenuItem[];
  search: string;
  category: string;
  money: (amount: number) => string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAddItem: () => void;
  onEditItem: (id: string) => void;
  onToggleAvailability: (id: string) => void;
  onDeactivateItem: (id: string) => void;
};

export default function MenuManagement({
  menuItems,
  search,
  category,
  money,
  onSearchChange,
  onCategoryChange,
  onAddItem,
  onEditItem,
  onToggleAvailability,
  onDeactivateItem,
}: MenuManagementProps) {
  const categories = [
    "All",
    ...Array.from(new Set(menuItems.map((item) => item.category))),
  ].filter((value) => value === "All" || value.trim() !== "");

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || item.category === category;

    return matchesSearch && matchesCategory && item.active;
  });

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <div className="eyebrow">FOOD &amp; BEVERAGE</div>
          <h1>Menu management</h1>
          <p className="section-description">
            Keep your menu, prices, and availability up to date.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onAddItem}
        >
          + Add menu item
        </button>
      </div>

      <div className="menu-toolbar">
        <div className="menu-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search menu items..."
            aria-label="Search menu items"
          />
        </div>

        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          aria-label="Filter by category"
        >
          {categories.map((itemCategory) => (
            <option key={itemCategory} value={itemCategory}>
              {itemCategory === "All" ? "All categories" : itemCategory}
            </option>
          ))}
        </select>

        <span className="muted-label">
          {filteredItems.length} items
        </span>
      </div>

      {filteredItems.length === 0 ? (
        <div className="panel empty-state">
          <span className="empty-state-icon">◫</span>
          <h3>No menu items found</h3>
          <p>Try another search or add a new menu item.</p>
        </div>
      ) : (
        <div className="menu-management-grid">
          {filteredItems.map((item) => (
            <article className="menu-management-card" key={item.id}>
              <div className="menu-management-image">
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div className="menu-image-placeholder">S&amp;S</div>
                )}

                <span
                  className={`availability-badge ${
                    item.available ? "is-available" : "is-unavailable"
                  }`}
                >
                  {item.available ? "Available" : "Unavailable"}
                </span>
              </div>

              <div className="menu-management-details">
                <div className="menu-item-category">{item.category}</div>
                <h3>{item.name}</h3>

                {item.description && (
                  <p className="menu-item-description">
                    {item.description}
                  </p>
                )}

                <strong className="menu-management-price">
                  {money(item.price)}
                </strong>

                <div className="menu-management-actions">
                  <button
                    type="button"
                    className="table-action"
                    onClick={() => onEditItem(item.id)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="table-action"
                    onClick={() => onToggleAvailability(item.id)}
                  >
                    {item.available ? "Mark unavailable" : "Mark available"}
                  </button>

                  <button
                    type="button"
                    className="table-action danger-action"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Deactivate "${item.name}" from the menu?`
                        )
                      ) {
                        onDeactivateItem(item.id);
                      }
                    }}
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
