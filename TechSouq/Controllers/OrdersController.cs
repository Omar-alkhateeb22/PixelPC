using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PixelPC.DTOs.OrdersDtos;
using PixelPC.Models;
using System.Security.Claims;

namespace PixelPC.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly PixelPCDbContext _dbContext;
        public OrdersController(PixelPCDbContext dbContext)
        {
            _dbContext = dbContext;
        }
        [HttpPost("checkout")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> Checkout(CheckoutDto dto)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;
            var userId = long.Parse(userIdString);

            var cart = await _dbContext.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
            if (cart == null)
            {
                return BadRequest("Cart is empty");
            }

            var cartItems = await _dbContext.CartItems.Where(ci => ci.CartId == cart.Id).ToListAsync();
            if (cartItems.Count == 0)
            {
                return BadRequest("Cart is empty");
            }

            using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var shortages = new List<string>();
                foreach (var item in cartItems)
                {
                    var variant = await _dbContext.ProductVariants.FirstOrDefaultAsync(v => v.Id == item.ProductVariantId);
                    if (variant == null || variant.StockQuantity < item.Quantity)
                    {
                        shortages.Add($"Variant #{item.ProductVariantId}");
                    }
                }

                if (shortages.Count > 0)
                {
                    return BadRequest("Insufficient stock for: " + string.Join(", ", shortages));
                }

                var order = new Order
                {
                    UserId = userId,
                    OrderDate = DateTime.UtcNow,
                    Status = "Pending",
                    ShippingAddress = dto.ShippingAddress,
                    TotalAmount = 0
                };
                _dbContext.Orders.Add(order);
                await _dbContext.SaveChangesAsync();

                decimal totalAmount = 0;

                foreach (var item in cartItems)
                {
                    var variant = await _dbContext.ProductVariants.FirstOrDefaultAsync(v => v.Id == item.ProductVariantId);

                    _dbContext.OrderItems.Add(new OrderItem
                    {
                        OrderId = order.Id,
                        ProductVariantId = variant.Id,
                        Quantity = item.Quantity,
                        UnitPrice = variant.Price
                    });

                    totalAmount += variant.Price * item.Quantity;
                    variant.StockQuantity -= item.Quantity;

                    _dbContext.StockMovements.Add(new StockMovement
                    {
                        ProductVariantId = variant.Id,
                        OrderId = order.Id,
                        MovementType = "Out",
                        Quantity = item.Quantity,
                        Reason = "Purchase",
                        CreatedAt = DateTime.UtcNow
                    });

                    if (variant.StockQuantity <= 0)
                    {
                        _dbContext.Notifications.Add(new Notification
                        {
                            UserId = null,
                            Type = "OutOfStock",
                            Message = $"Variant {variant.StockKeepingUnit} is out of stock.",
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                    else if (variant.StockQuantity <= variant.ReorderLevel)
                    {
                        _dbContext.Notifications.Add(new Notification
                        {
                            UserId = null,
                            Type = "LowStock",
                            Message = $"Variant {variant.StockKeepingUnit} stock is low ({variant.StockQuantity} left).",
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                order.TotalAmount = totalAmount;

                var invoiceNumber = $"INV-{DateTime.UtcNow.Year}-{order.Id:D5}";
                _dbContext.Invoices.Add(new Invoice
                {
                    OrderId = order.Id,
                    InvoiceNumber = invoiceNumber,
                    IssueDate = DateTime.UtcNow,
                    TotalAmount = totalAmount
                });

                _dbContext.Notifications.Add(new Notification
                {
                    UserId = userId,
                    Type = "OrderConfirmed",
                    Message = $"Your order #{order.Id} has been confirmed.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });

                _dbContext.CartItems.RemoveRange(cartItems);

                await _dbContext.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Order placed successfully",
                    orderId = order.Id,
                    invoiceNumber,
                    totalAmount
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "Checkout failed, please try again");
            }
        }

        [HttpGet("GetMyOrders")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;
            var userId = long.Parse(userIdString);

            var orders = await (from o in _dbContext.Orders
                                where o.UserId == userId
                                orderby o.OrderDate descending
                                select new
                                {
                                    o.Id,
                                    o.OrderDate,
                                    o.Status,
                                    o.TotalAmount,
                                    o.ShippingAddress
                                }).ToListAsync();

            return Ok(orders);
        }

        [HttpGet("GetOrderById")]
        [Authorize(Roles = "Admin,Customer")]
        public async Task<IActionResult> GetOrderById(long id)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;
            var userId = long.Parse(userIdString);
            var role = User.FindFirst(ClaimTypes.Role)!.Value;

            var order = await _dbContext.Orders.FirstOrDefaultAsync(o => o.Id == id);
            if (order == null)
            {
                return NotFound("Order not found");
            }

            if (role == "Customer" && order.UserId != userId)
            {
                return NotFound("Order not found");
            }

            var items = await (from oi in _dbContext.OrderItems
                               from v in _dbContext.ProductVariants.Where(x => x.Id == oi.ProductVariantId).DefaultIfEmpty()
                               from p in _dbContext.Products.Where(x => x.Id == v.ProductId).DefaultIfEmpty()
                               where oi.OrderId == id
                               select new
                               {
                                   ProductName = p.Name,
                                   v.StockKeepingUnit,
                                   oi.Quantity,
                                   oi.UnitPrice
                               }).ToListAsync();

            var result = new
            {
                order.Id,
                order.OrderDate,
                order.Status,
                order.TotalAmount,
                order.ShippingAddress,
                Items = items
            };

            return Ok(result);
        }

        [HttpPatch("UpdateOrderStatus")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateOrderStatus(long id, UpdateOrderStatusDto dto)
        {
            var order = await _dbContext.Orders.FirstOrDefaultAsync(o => o.Id == id);
            if (order == null)
            {
                return NotFound("Order not found");
            }

            var allowedStatuses = new[] { "Pending", "Confirmed", "Shipped", "Cancelled" };
            if (!allowedStatuses.Contains(dto.Status))
            {
                return BadRequest("Invalid status. Allowed: Pending, Confirmed, Shipped, Cancelled");
            }

            order.Status = dto.Status;
            await _dbContext.SaveChangesAsync();

            return Ok("Order status updated:" + order.Status);
        }
    }
}