using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PixelPC.Models;
using System.Security.Claims;

namespace PixelPC.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InvoicesController : ControllerBase
    {
        private readonly PixelPCDbContext _dbContext;

        public InvoicesController(PixelPCDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet("GetInvoiceByOrderId")]
        [Authorize(Roles = "Admin,Customer")]
        public async Task<IActionResult> GetInvoiceByOrderId(long orderId)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;
            var userId = long.Parse(userIdString);
            var role = User.FindFirst(ClaimTypes.Role)!.Value;

            var order = await _dbContext.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null)
            {
                return NotFound("Order not found");
            }

            if (role == "Customer" && order.UserId != userId)
            {
                return NotFound("Order not found");
            }

            var invoice = await _dbContext.Invoices.FirstOrDefaultAsync(i => i.OrderId == orderId);
            if (invoice == null)
            {
                return NotFound("Invoice not found for this order");
            }

            var result = new
            {
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.IssueDate,
                invoice.TotalAmount,
                invoice.PdfUrl,
                OrderId = order.Id,
                order.OrderDate,
                order.Status,
                order.ShippingAddress
            };

            return Ok(result);
        }
    }
}