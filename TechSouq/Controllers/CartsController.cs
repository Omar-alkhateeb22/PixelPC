using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PixelPC.DTOs.CartsDtos;
using PixelPC.DTOs.CategoriesDtos;
using PixelPC.Models;
using System.Security.Claims;

namespace PixelPC.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartsController : ControllerBase
    {

        private PixelPCDbContext _dbContext;

        public CartsController(PixelPCDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet("GetMyCart")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyCart()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var userId = long.Parse(userIdString);

            var cart = await (from c in _dbContext.Carts
                              where c.UserId == userId
                              select new
                              {
                                  c.Id,
                                  c.CreatedAt
                              }).FirstOrDefaultAsync();
            if (cart == null)
            {
                return NotFound();
            }
            var items = await (from ci in _dbContext.CartItems
                               from v in _dbContext.ProductVariants.Where(x => x.Id == ci.ProductVariantId).DefaultIfEmpty()
                               from p in _dbContext.Products.Where(x => x.Id == v.ProductId).DefaultIfEmpty()
                               where ci.CartId == cart.Id
                               select new
                               {
                                   ci.Id,
                                   ProductName = p.Name,
                                   v.StockKeepingUnit,
                                   v.Price,
                                   ci.Quantity
                               }).ToListAsync();
            var result = new
            {
                cart.CreatedAt,
                Items = items
            };
            return Ok(result);
        }

        [HttpPost("AddToCart")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> AddToCart(AddCartItemsDto dto)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var userId = long.Parse(userIdString);

            var variant = await _dbContext.ProductVariants.FirstOrDefaultAsync(v => v.Id == dto.ProductVariantId);
            if (variant == null)
            {
                return NotFound();
            }
            if (variant.StockQuantity < dto.Quantity)
            {
                return BadRequest(new { message = "Not enough stock available" });
            }

            var cart = await _dbContext.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
            if (cart == null)
            {
                cart = new Cart
                { 
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Carts.Add(cart);
                await _dbContext.SaveChangesAsync();
            }

            var existingItem = await _dbContext.CartItems
                .FirstOrDefaultAsync(ci => ci.CartId == cart.Id && ci.ProductVariantId == dto.ProductVariantId);

            if (existingItem != null)
            {
                existingItem.Quantity += dto.Quantity;
            }
            else
            {
                var newItem = new CartItem
                {
                    CartId = cart.Id,
                    ProductVariantId = dto.ProductVariantId,
                    Quantity = dto.Quantity
                };
                _dbContext.CartItems.Add(newItem);
            }
            await _dbContext.SaveChangesAsync();
            return Ok();
        }
        [HttpPut("UpdateCartItem")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> UpdateCartItem(long id, UpdateCartItemDto dto)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var userId = long.Parse(userIdString);

            var cartItem = await (from ci in _dbContext.CartItems
                                  from c in _dbContext.Carts.Where(x => x.Id == ci.CartId).DefaultIfEmpty()
                                  where ci.Id == id && c.UserId == userId
                                  select ci).FirstOrDefaultAsync();
            if (cartItem == null)
            {
                return NotFound();
            }
            var variant = await _dbContext.ProductVariants.FirstOrDefaultAsync(v => v.Id == cartItem.ProductVariantId);
            if (variant == null || variant.StockQuantity < dto.Quantity)
            {
                return BadRequest();
            }
            cartItem.Quantity = dto.Quantity;
            await _dbContext.SaveChangesAsync();

            return Ok();
        }
        [HttpDelete("RemoveCartItem")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> RemoveCartItem(long id)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var userId = long.Parse(userIdString);

            var cartItem = await (from ci in _dbContext.CartItems
                                  from c in _dbContext.Carts.Where(x => x.Id == ci.CartId).DefaultIfEmpty()
                                  where ci.Id == id && c.UserId == userId
                                  select ci).FirstOrDefaultAsync();

            if (cartItem == null)
            {
                return NotFound(new { message = "Cart item not found" });
            }
            _dbContext.CartItems.Remove(cartItem);
            await _dbContext.SaveChangesAsync();
            return Ok();
        }
    }
}
    