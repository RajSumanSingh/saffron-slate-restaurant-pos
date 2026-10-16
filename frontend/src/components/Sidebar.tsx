
"use client";

type Section = "Overview" | "New order" | "Orders" | "Menu";

type SidebarProps = {
  section: Section;
  onSectionChange: (section: Section) => void;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
};

const navItems: { label: Section; icon: string }[] = [
  { label: "Overview", icon: "▦" },
  { label: "New order", icon: "+" },
  { label: "Orders", icon: "≡" },
  { label: "Menu", icon: "◫" },
];

export default function Sidebar({
  section,
  onSectionChange,
  userName = "Restaurant Admin",
  userRole = "Administrator",
  onLogout,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">S.</div>
        <div>
          <div className="brand-name">Saffron &amp; Slate</div>
          <div className="brand-subtitle">
            RESTAURANT OPERATIONS
          </div>
        </div>
      </div>

      <div className="side-label">WORKSPACE</div>

      <nav className="nav-list">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`nav-item ${
              section === item.label ? "active" : ""
            }`}
            onClick={() => onSectionChange(item.label)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>

            {item.label === "New order" && (
              <span className="nav-shortcut">POS</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="open-indicator">
          <span />
          Service is live
        </div>

        <div className="profile">
          <div className="avatar">
            {userName.charAt(0).toUpperCase()}
          </div>

          <div className="profile-info">
            <strong>{userName}</strong>
            <span>{userRole}</span>
          </div>

          {onLogout && (
            <button
              type="button"
              className="profile-menu"
              onClick={onLogout}
              aria-label="Log out"
              title="Log out"
            >
              ↪
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
