# PixelPC — Full Project Summary (Backend)

## Overview

**PixelPC** (formerly TechStock) is a graduation project: a Backend system for an e-commerce store specialized in computer parts and accessories.

- **Stack**: ASP.NET Core (.NET 8), Entity Framework Core, PostgreSQL
- **Auth**: JWT + BCrypt
- **Project status**: Backend MVP fully complete (all controllers built and tested via Postman). Next step: building the Frontend with Angular.

---

## Core Design Decisions (Locked-in)

| Decision | Details |
|---|---|
| All IDs | `long` (not `int`) |
| Categories | **Flat, no hierarchy** — no `ParentCategoryId`. The Parent/Child concept was deliberately removed to avoid circular-reference complexity |
| SKU | Field name is `StockKeepingUnit` (not `Sku`) |
| Roles / Statuses (Role, Status, MovementType, NotificationType) | All are `string` (not `enum`) |
| `ProductVariant` | A core, standalone entity separate from `Product` — carries price and stock; essential to the design |
| Query style | **LINQ Query Syntax** (`from...where...select`), not Method Syntax (`.Where().Select()`) |
| Nullable Foreign Keys | Handled with `DefaultIfEmpty()` for explicit Left Joins, instead of relying on Navigation Properties |
| API responses | Never return raw Entities — always `select new { }` into a trimmed-down shape, avoiding circular-reference risk and over-fetching |
| Error messages | Plain strings (`return BadRequest("message")`) instead of wrapped objects (`{ message: "..." }`) |

---

## Data Model — 11 Entities

1. **User** — `Id, FullName, Email, PasswordHash, Role (string: Admin/Customer), CreatedAt`
2. **Category** — `Id, Name` (flat, no hierarchy)
3. **Product** — `Id, Name, Brand, Description, CategoryId`
4. **ProductVariant** — `Id, ProductId, StockKeepingUnit, AttributesJson, Price, StockQuantity, ReorderLevel`
5. **Cart** — `Id, UserId, CreatedAt`
6. **CartItem** — `Id, CartId, ProductVariantId, Quantity`
7. **Order** — `Id, UserId, OrderDate, Status (string), TotalAmount, ShippingAddress`
8. **OrderItem** — `Id, OrderId, ProductVariantId, Quantity, UnitPrice (price snapshot at purchase time)`
9. **Invoice** — `Id, OrderId (1-to-1, unique), InvoiceNumber (unique, format INV-YYYY-00001), IssueDate, TotalAmount, PdfUrl (nullable — real PDF generation is still a Stretch Goal)`
10. **StockMovement** — `Id, ProductVariantId, OrderId (nullable), MovementType (string: In/Out), Quantity, Reason, CreatedAt`
11. **Notification** — `Id, UserId (nullable — null = admin-wide notification), Type (string), Message, IsRead, CreatedAt`

---

## Controllers and Full Endpoint List

### 1. AuthController
| Method | Endpoint | Auth | Note |
|---|---|---|---|
| POST | `/api/auth/register` | Public | `Role` is currently open in the DTO for testing convenience (Admin/Customer) — **must be locked down before final submission and defaulted to Customer only** |
| POST | `/api/auth/login` | Public | Returns a JWT token valid for 7 days |

### 2. CategoriesController
| Method | Endpoint | Auth |
|---|---|---|
| GET | `GetAllCategories` | Public |
| GET | `GetCategoriesByID?id=` | Public |
| POST | `CreateCategory` | Admin |
| PUT | `UpdateCategory?id=` | Admin |
| DELETE | `DeleteCategory?id=` | Admin — checks for linked products before allowing deletion |

### 3. ProductsController
| Method | Endpoint | Auth | Note |
|---|---|---|---|
| GET | `GetAllProducts` (+ filters: CategoryId, Brand, MinPrice, MaxPrice) | Public | Optional filtering via query params; Left Join with Category |
| GET | `GetProductByID?id=` | Public | Returns the product **along with all its Variants** |
| POST | `CreateProduct` | Admin | |
| PUT | `UpdateProduct?id=` | Admin | |
| DELETE | `DeleteProduct?id=` | Admin | |
| POST | `CreateVariant?id=` | Admin | `id` here = parent product's Id (from the route) |
| PUT | `UpdateVariant?id=` | Admin | `id` here = the Variant's own Id |
| DELETE | `DeleteVariant?id=` | Admin | |

### 4. CartController
| Method | Endpoint | Auth | Note |
|---|---|---|---|
| GET | `GetMyCart` | Customer | Returns `"your cart is empty "` (plain string) if no cart exists, otherwise a full object with Items |
| POST | `items` (AddToCart) | Customer | Creates a Cart lazily if one doesn't exist; merges quantity if the Variant is already in the cart instead of duplicating it |
| PUT | `items/{id}` | Customer | Updates item quantity — verifies ownership via a Join with Cart |
| DELETE | `items/{id}` | Customer | Removes an item — same ownership check |

### 5. OrdersController
| Method | Endpoint | Auth | Note |
|---|---|---|---|
| POST | `checkout` | Customer | **The most important operation in the project** — full breakdown below |
| GET | `GetMyOrders` | Customer | Current user's orders only |
| GET | `{id}` | Admin,Customer | Customers see only their own orders; Admins can view any order |
| PATCH | `{id}/status` | Admin | Updates order status (Pending/Confirmed/Shipped/Cancelled) |

### 6. InvoicesController
| Method | Endpoint | Auth |
|---|---|---|
| GET | `{orderId}` | Admin,Customer — same ownership-check logic as Orders |

### 7. NotificationsController
| Method | Endpoint | Auth | Note |
|---|---|---|---|
| GET | `` (root) | Admin,Customer | Admins see admin-wide notifications (`UserId == null`); Customers see only their own |
| GET | `unread-count` | Admin,Customer | Powers an unread-notifications badge in the future UI |
| PATCH | `{id}/read` | Admin,Customer | Dual ownership check (Customer vs. Admin) |

### 8. StockMovementsController
| Method | Endpoint | Auth | Note |
|---|---|---|---|
| GET | `` (+ filters: productVariantId, orderId) | Admin | Full historical log for auditing |
| POST | `adjust` | Admin | Manual stock adjustment (In/Out); `OrderId = null` since it's not tied to an order |

---

## Checkout Flow Breakdown (the project's core business logic)

Built inside a single **Database Transaction** (`BeginTransactionAsync` / `CommitAsync` / `RollbackAsync`) to guarantee atomicity:

1. Verify the cart exists and has items (otherwise `BadRequest`)
2. Check stock availability for **every item** before making any changes (otherwise `BadRequest` listing the shortages)
3. Create the `Order` (Status = "Pending")
4. For each cart item:
   - Create an `OrderItem` with `UnitPrice` = a **snapshot** of the Variant's price at purchase time (unaffected by future price changes)
   - Deduct `StockQuantity` from the Variant
   - Log a `StockMovement` (MovementType = "Out", linked to the OrderId)
   - If `StockQuantity <= 0` → trigger an `OutOfStock` notification (UserId = null, admin-wide)
   - If `StockQuantity <= ReorderLevel` → trigger a `LowStock` notification (UserId = null)
5. Calculate the total `TotalAmount` and update the Order
6. Auto-generate an `Invoice` (number format: `INV-{Year}-{OrderId:D5}`)
7. Trigger an `OrderConfirmed` notification for the customer
8. Clear the cart (`RemoveRange` on CartItems)
9. `CommitAsync()` — or a full `RollbackAsync()` if any step fails

---

## Recurring Security Patterns Applied Consistently

1. **Users cannot permanently choose their own `Role` at registration** (currently open temporarily for development only — an explicit note to close this before final submission)
2. **Foreign Keys are always `long` in DTOs**, never a name/string — e.g., `CategoryId`, `ProductVariantId`
3. **The parent ID is taken from the Route, not the Body**, for nested routes (e.g., `CreateVariant?id={productId}`) — to avoid conflicting sources of truth
4. **Ownership checks are mandatory** on every endpoint dealing with user-specific data (Cart, Orders, Notifications) — by comparing the `UserId` extracted from JWT Claims against the actual data owner, often via an explicit Join (e.g., `CartItem → Cart → UserId`)
5. **`NotFound()` instead of `Forbidden()`** when a user attempts unauthorized access to another user's data — to avoid revealing that the record even exists
6. **`UserId`/`Role` are extracted from `ClaimTypes` only when actually needed** in downstream logic (filtering, comparisons) — not automatically on every protected endpoint, to avoid dead variables

```csharp
var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;
var userId = long.Parse(userIdString);
var role = User.FindFirst(ClaimTypes.Role)!.Value;
```

---

## Common Mistakes Fixed During Development (Lessons Learned)

- Reversed `if` conditions (`!= null` instead of `== null`) in Update/Delete operations
- Queries returning all records instead of the specific record/list intended (missing `where` clause or wrong variable reference)
- Confusing `Products` and `ProductVariants` as the target table for different operations (e.g., `DeleteVariant` was mistakenly deleting from `Products`)
- Returning raw Entities directly (`return Ok(entity)`), risking circular references and over-fetching — replaced everywhere with `select new {}`
- Not distinguishing between checking a single object (`== null`) and checking a list (`.Count == 0`)
- Forgetting `[FromQuery]` on a complex DTO in GET requests → `415 Unsupported Media Type` error
- Forgetting `app.UseAuthentication()` in `Program.cs` (only `UseAuthorization()` was present)

---

## Next Step: Angular Frontend

- **Priority**: re-enable CORS in `Program.cs` (it was intentionally removed mid-development at the user's explicit request):
  ```csharp
  builder.Services.AddCors(options =>
  {
      options.AddPolicy("AllowAngular", policy =>
          policy.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod());
  });
  // ...
  app.UseCors("AllowAngular");
  ```
- **User's preference**: a **simple, beginner-friendly UI** for non-technical users, loosely inspired by [os-jo.com](https://os-jo.com) (a top row of category icons + a product card grid), but **much simpler** — no animated banners or complex sections like "PC Builds"
- **Suggested incremental plan**: Auth pages → Product listing (simple grid) → Product details + variants → Cart → Checkout → polish the overall look afterward
- **Open question, not yet decided**: Standalone Components vs. NgModules? A ready-made UI library (Angular Material / Bootstrap) or custom CSS?

---

## Remaining Housekeeping Items Before Final Submission

- [ ] Close the `Role` selection loophole at Register (lock it to `"Customer"`)
- [ ] Remove any temporary dev-only endpoint (if a dev-only admin-creation endpoint was ever added)
- [ ] Review route naming for consistency (some controllers use custom route names like `GetAllCategories` instead of relying fully on standard REST `[HttpGet]`/`[HttpGet("{id}")]` — a deliberate choice kept as-is for now)
- [ ] Implement real PDF invoice generation (Stretch Goal, optional)
