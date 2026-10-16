# Saffron & Slate --- Restaurant POS & Order Management System

A web-based Point of Sale (POS) demo for managing restaurant menu items,
orders, order progress, payment records, and daily activity.

> **Important:** Payment recording updates an order's status and method.
> It does not process real card or UPI transactions.

## Features

### Dashboard / Overview

-   View completed-order sales and total orders.
-   See orders in progress and orders ready to serve.
-   Review recent orders and navigate to the order queue.

### New Order / POS

-   Search menu items and filter by category.
-   Add available menu items to a cart and adjust quantities.
-   Create dine-in, takeaway, or delivery orders.
-   Assign a table for dine-in orders.
-   Apply a discount (0%, 5%, 10%, or 15% in the current UI).
-   Review subtotal, discount, tax, and total before placing an order.

### Order Management

-   View orders and their details.
-   Track statuses such as Pending, Preparing, Ready, Completed, and
    Cancelled.
-   Record payment status and payment method for authorized users.
-   Supported methods in the current implementation: cash, card, and
    UPI.

### Menu Management

-   View, search, and filter menu items by category.
-   Create and manage menu items, including price and availability.
-   Deactivate items that should no longer appear in the active ordering
    catalogue.

### Authentication

-   JWT-based authentication.
-   Role-based access for admin and staff.
-   Backend authorization protects administrative actions.

## Technology Stack

  Layer            Technology
  ---------------- ---------------------------------
  Frontend         Next.js, React, TypeScript
  Styling          CSS
  Backend          Node.js, Express.js, TypeScript
  Database         MongoDB
  Authentication   JSON Web Tokens (JWT)
  API              REST

## Project Structure

The exact structure may vary by local setup. The project is organized
into frontend and backend applications, for example:

``` text
restaurant-pos/
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx
│   │   └── globals.css
│   └── package.json
└── backend/
    ├── src/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── models/
    │   ├── routes/
    │   └── server.ts
    └── package.json
```

## Prerequisites

-   Node.js and npm
-   MongoDB Atlas or a local MongoDB instance
-   Git (optional)

Use a Node.js version supported by the `package.json` files in your
project.

## Local Setup

### 1. Get the source code

``` bash
git clone <YOUR_PUBLIC_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
```

Or open the project folder you already have.

### 2. Set up the backend

``` bash
cd backend
npm install
```

Create `backend/.env`. The names below are examples; match them to the
variables actually read by your backend:

``` env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:3000
```

Replace the MongoDB connection string and JWT secret with your own
values. Never commit `.env` files or credentials to GitHub.

Start the backend using the script defined in `backend/package.json`. A
common development command is:

``` bash
npm run dev
```

### 3. Set up the frontend

Open a second terminal:

``` bash
cd frontend
npm install
```

If your frontend API client uses an environment variable for the API
base URL, create `frontend/.env.local`. For example:

``` env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Use the exact variable name and API prefix expected by your code. If
your frontend does not use this variable, do not add it.

Start Next.js using the script in `frontend/package.json`, commonly:

``` bash
npm run dev
```

Open the local URL printed in the terminal, usually
`http://localhost:3000`.

## Environment Variables

  -----------------------------------------------------------------------------
  Variable                Purpose                 Example / guidance
  ----------------------- ----------------------- -----------------------------
  `PORT`                  Backend server port     `5000`

  `MONGO_URI`             MongoDB connection      Keep it private in backend
                          string                  `.env`

  `JWT_SECRET`            Signs/verifies          Use a long random secret
                          authentication tokens   

  `FRONTEND_URL`          Allowed frontend origin `http://localhost:3000`
                          for CORS, if used       

  `NEXT_PUBLIC_API_URL`   Frontend API base URL,  `http://localhost:5000/api`
                          if used                 
  -----------------------------------------------------------------------------

These are examples, not a guarantee that every variable is used in the
current code. Confirm variable names and values against the backend
configuration and frontend API client.

## Main Order Workflow

1.  Sign in with an authorized account.
2.  Open **New order** and select menu items.
3.  Choose dine-in, takeaway, or delivery; select a table for dine-in.
4.  Review quantities, discount, tax, and total.
5.  Place the order.
6.  Open **Orders** to review the order and update its status.
7.  An authorized admin can record the payment status and method.

## API Notes

The backend has routes for authentication, menu management, and order
management. Protected endpoints require authentication, and
administrative operations require the appropriate role.

The implementation includes a payment-status update endpoint shaped
like:

``` http
PATCH /api/orders/:id/payment
```

The final URL depends on how the Express router is mounted. Check the
backend route files for the complete endpoint list and request/response
formats.

For submission, include a Postman collection or Swagger/OpenAPI
documentation where applicable. Do not list endpoints as available until
you have verified them in the running application.

## Build and Test

Run scripts defined in each project's `package.json`. Typical commands
are:

``` bash
# In backend/
npm run build

# In frontend/
npm run build
```

Before submission, test: - Login and role restrictions - Creating,
editing, searching, and deactivating menu items - Creating dine-in,
takeaway, and delivery orders - Cart quantity changes and empty-cart
validation - Discount, tax, and total calculations - Order status
transitions - Payment status and payment-method recording - Responsive
layout on desktop and mobile - API error handling and database
connectivity

## Deployment

Deploy the frontend and backend to publicly accessible hosting
platforms. Configure production environment variables in hosting
dashboards; do not commit secrets.

Before submission: - Set the production MongoDB connection string and
JWT secret securely. - Configure CORS to allow only the deployed
frontend origin(s). - Remove temporary local-network development origins
from production CORS. - Confirm the deployed backend can reach
MongoDB. - Test login and core workflows using the public deployment
URL. - Provide demo credentials for reviewers if login is required. Use
test data and never publish real passwords. - Verify that the public
GitHub repository opens without requesting access.

## Security Notes

-   Never commit API keys, database credentials, JWT secrets, private
    keys, or real customer data.
-   Keep authorization checks on the backend; hiding a control in the
    frontend is not security.
-   Use test accounts and test data for demonstrations.
-   This app records payment status and method; it does not securely
    process card or UPI payments.

## Known Scope / Limitations

-   This is a demonstration project, not a production-certified
    restaurant payment platform.
-   The POS interface currently displays tax at 5%; verify that the
    backend independently recalculates and validates totals.
-   Payment recording is not connected to a bank, card processor, or UPI
    provider.
-   Add the final production URLs, demo access details, exact
    environment-variable names, and verified API collection after
    deployment.

## Submission Checklist

-   [ ] Public frontend deployment URL
-   [ ] Public backend deployment URL, if hosted separately
-   [ ] Public GitHub repository URL
-   [ ] Setup instructions tested on a clean environment
-   [ ] Environment variables documented without exposing values
-   [ ] Demo credentials provided securely if needed
-   [ ] Postman collection or Swagger/OpenAPI documentation
-   [ ] No secrets committed to the repository
-   [ ] Deployed links tested without access requests

