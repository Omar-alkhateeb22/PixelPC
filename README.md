# PixelPC 🖥️

A full-featured e-commerce platform for computer parts and accessories — a graduation project featuring a complete ASP.NET Core backend and an Angular frontend.

![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)
![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-336791?logo=postgresql)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap)

---

## Overview

**PixelPC** is a complete e-commerce system built for a store specializing in computer hardware and accessories (laptops, desktops, keyboards, mice, monitors, headsets). It supports two user roles:

- **Admin** — full management of categories, products, variants, stock, and orders
- **Customer** — product browsing, shopping cart, checkout, and order tracking

---

## Tech Stack

### Backend
- ASP.NET Core (.NET 8) Web API
- Entity Framework Core
- PostgreSQL
- JWT Authentication + BCrypt password hashing
- Role-based Authorization (Admin / Customer)

### Frontend
- Angular (Standalone Components, Signals)
- Bootstrap 5 + Bootstrap Icons
- Fully RTL, Arabic UI

---

## Key Features

### Customer-facing
- 🏠 Home page with a category grid and featured products
- 🔍 Product browsing with filters by category, brand, and price range
- 📦 Product details page with variant selection
- 🛒 Interactive shopping cart (add, update quantity, remove)
- ✅ Full checkout flow wrapped in a single database transaction (stock validation, automatic deduction, invoice generation)
- 📋 "My Orders" page for tracking order status

### Admin-facing
- 🎛️ Dashboard with live stats
- 🏷️ Category management
- 💻 Product and variant management with image upload
- 📊 Stock movement history log with manual adjustment support
- 🧾 Order management with status updates



---

## Checkout Flow

The purchase process runs entirely inside a **single database transaction**:

1. Verify stock availability for every item in the cart
2. Create the order (`Order`) and its items (`OrderItem`) with a price locked at purchase time
3. Deduct quantity from the relevant `ProductVariant`
4. Log a stock movement (`StockMovement`)
5. Auto-generate an invoice (`Invoice`) formatted as `INV-{Year}-{Number}`
6. Trigger automatic notifications (order confirmed, low stock, out of stock)
7. Clear the cart

If any step fails, the entire transaction rolls back, leaving no partial changes to the data.

---

## Project Structure

```
PixelPC/
├── backend/                 # ASP.NET Core Web API
│   ├── Controllers/
│   ├── Models/
│   ├── DTOs/
│   └── Program.cs
└── frontend/
    └── PixelPC/
        ├── Screenshots/      # App screenshots
        └── src/app/
            ├── core/         # Services, Guards, Interceptors, Models
            ├── layout/       # Header, Footer, Admin Nav
            └── pages/        # Customer and Admin pages
```

---

## Running Locally

### Prerequisites
- .NET 8 SDK
- PostgreSQL

### Backend
Runs on: `https://localhost:44379`

### Frontend
Runs on: `http://localhost:4200`


---

## 📸 Screenshots

| Page | Screenshot |
|---|---|
| Login | ![Login](TechSouq/Frontend/PixelPC/Screenshots/Login.png) |
| Register | ![Register](TechSouq/Frontend/PixelPC/Screenshots/Register.png) |
| Home page | ![DashBoared](TechSouq/Frontend/PixelPC/Screenshots/DashBoared.png) |
| All Products | ![AllProducts](TechSouq/Frontend/PixelPC/Screenshots/AllProducts.png) |
| Product Details | ![Products](TechSouq/Frontend/PixelPC/Screenshots/Products.png) |
| Product Details (extra view) | ![Products2](TechSouq/Frontend/PixelPC/Screenshots/Products2.png) |
| Shopping Cart | ![Basket](TechSouq/Frontend/PixelPC/Screenshots/The%20basket.png) |
| Shopping Cart (extra view) | ![Basket2](TechSouq/Frontend/PixelPC/Screenshots/The%20basket2.png) |
| Admin Dashboard | ![AdminDashBoard](TechSouq/Frontend/PixelPC/Screenshots/AdminDashBoared.png) |
| Category Management | ![CategoryManagement](TechSouq/Frontend/PixelPC/Screenshots/Category%20Management.png) |
| Product Management | ![ProductsManagement](TechSouq/Frontend/PixelPC/Screenshots/ProductsManagement.png) |
| Product Management (extra view) | ![ProductsManagement2](TechSouq/Frontend/PixelPC/Screenshots/ProductsManagement2.png) |
| Stock Management | ![StorageManagement](TechSouq/Frontend/PixelPC/Screenshots/StorageManagement.png) |
| Order Management (Admin) | ![OrdersAdmin](TechSouq/Frontend/PixelPC/Screenshots/Orders-AdminAprove.png) |
| My Orders (Customer) | ![MyOrders](TechSouq/Frontend/PixelPC/Screenshots/MyOrders.png) |

---

## Author
Omar Alkhateeb
omaralkhateeb1w@gmail.com

---
