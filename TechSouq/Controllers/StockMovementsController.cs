using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PixelPC.DTOs.StockMovementsDtos;
using PixelPC.Models;
using System.Security.Claims;

namespace PixelPC.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StockMovementsController : ControllerBase
    {
        private readonly PixelPCDbContext _dbContext;

        public StockMovementsController(PixelPCDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet("GetAllStockMovements")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllStockMovements([FromQuery] long? productVariantId, [FromQuery] long? orderId)
        {
            var UserIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var UserId = int.Parse(UserIdString);

            var movements = await (from sm in _dbContext.StockMovements
                                   from v in _dbContext.ProductVariants.Where(x => x.Id == sm.ProductVariantId).DefaultIfEmpty()
                                   where
                                        (productVariantId == null || sm.ProductVariantId == productVariantId) &&
                                        (orderId == null || sm.OrderId == orderId)
                                   orderby sm.CreatedAt descending
                                   select new
                                   {
                                       sm.Id,
                                       sm.ProductVariantId,
                                       StockKeepingUnit = v.StockKeepingUnit,
                                       sm.OrderId,
                                       sm.MovementType,
                                       sm.Quantity,
                                       sm.Reason,
                                       sm.CreatedAt
                                   }).ToListAsync();

            return Ok(movements);
        }

        [HttpPost("adjust")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdjustStock(AdjustStockDto dto)
        {
            var UserIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var UserId = int.Parse(UserIdString);

            var variant = await _dbContext.ProductVariants.FirstOrDefaultAsync(v => v.Id == dto.ProductVariantId);
            if (variant == null)
            {
                return NotFound("Product variant not found");
            }

            if (dto.MovementType == "Out" && variant.StockQuantity < dto.Quantity)
            {
                return BadRequest("Not enough stock to remove");
            }

            if (dto.MovementType == "In")
            {
                variant.StockQuantity += dto.Quantity;
            }
            else if (dto.MovementType == "Out")
            {
                variant.StockQuantity -= dto.Quantity;
            }
            else
            {
                return BadRequest("MovementType must be either 'In' or 'Out'");
            }

            _dbContext.StockMovements.Add(new StockMovement
            {
                ProductVariantId = variant.Id,
                OrderId = null, 
                MovementType = dto.MovementType,
                Quantity = dto.Quantity,
                Reason = dto.Reason,
                CreatedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();

            return Ok("Stock adjusted successfully. New quantity: " + variant.StockQuantity);
        }
    }
}