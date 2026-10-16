
"use client";

import type { FormEvent } from "react";

export type MenuFormData = {
  name: string;
  description: string;
  category: string;
  price: string;
  image: string;
};

type MenuModalProps = {
  isOpen: boolean;
  editing: boolean;
  form: MenuFormData;
  onFormChange: (field: keyof MenuFormData, value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function MenuModal({
  isOpen,
  editing,
  form,
  onFormChange,
  onClose,
  onSubmit,
}: MenuModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="menu-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-modal-title"
      >
        <div className="modal-heading">
          <div>
            <div className="eyebrow">MENU MANAGEMENT</div>
            <h2 id="menu-modal-title">
              {editing ? "Edit menu item" : "Add menu item"}
            </h2>
            <p>Enter the details for this menu item.</p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <form className="menu-form" onSubmit={onSubmit}>
          <div className="form-field">
            <label htmlFor="menu-name">Item name *</label>
            <input
              id="menu-name"
              required
              maxLength={100}
              value={form.name}
              onChange={(event) => onFormChange("name", event.target.value)}
              placeholder="e.g. Paneer Tikka"
            />
          </div>

          <div className="form-field">
            <label htmlFor="menu-category">Category *</label>
            <input
              id="menu-category"
              required
              maxLength={50}
              value={form.category}
              onChange={(event) =>
                onFormChange("category", event.target.value)
              }
              placeholder="e.g. Starters"
            />
          </div>

          <div className="form-field">
            <label htmlFor="menu-price">Price (₹) *</label>
            <input
              id="menu-price"
              type="number"
              required
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={(event) => onFormChange("price", event.target.value)}
              placeholder="e.g. 249"
            />
          </div>

          <div className="form-field">
            <label htmlFor="menu-image">Image path or URL</label>
            <input
              id="menu-image"
              value={form.image}
              onChange={(event) => onFormChange("image", event.target.value)}
              placeholder="/images/paneer-tikka.jpg"
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="menu-description">Description</label>
            <textarea
              id="menu-description"
              rows={3}
              maxLength={500}
              value={form.description}
              onChange={(event) =>
                onFormChange("description", event.target.value)
              }
              placeholder="Describe the dish and its ingredients..."
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit" className="primary-button">
              {editing ? "Save changes" : "Add menu item"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
