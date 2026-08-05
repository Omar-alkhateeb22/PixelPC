using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PixelPC.Models;
using System.Security.Claims;

namespace PixelPC.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly PixelPCDbContext _dbContext;

        public NotificationsController(PixelPCDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet("GetMyNotifications")]
        [Authorize(Roles = "Admin,Customer")]
        public async Task<IActionResult> GetMyNotifications()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;
            var userId = long.Parse(userIdString);
            var role = User.FindFirst(ClaimTypes.Role)!.Value;

            List<Notification> notifications;

            if (role == "Admin")
            {
                notifications = await _dbContext.Notifications
                    .Where(n => n.UserId == null)
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();
            }
            else
            {
                notifications = await _dbContext.Notifications
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();
            }

            var result = notifications.Select(n => new
            {
                n.Id,
                n.Type,
                n.Message,
                n.IsRead,
                n.CreatedAt
            });

            return Ok(result);
        }

        [HttpGet("GetUnreadCount")]
        [Authorize(Roles = "Admin,Customer")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;
            var userId = long.Parse(userIdString);
            var role = User.FindFirst(ClaimTypes.Role)!.Value;

            int count;

            if (role == "Admin")
            {
                count = await _dbContext.Notifications
                    .CountAsync(n => n.UserId == null && !n.IsRead);
            }
            else
            {
                count = await _dbContext.Notifications
                    .CountAsync(n => n.UserId == userId && !n.IsRead);
            }

            return Ok(count);
        }

        [HttpPatch("MarkAsRead")]
        [Authorize(Roles = "Admin,Customer")]
        public async Task<IActionResult> MarkAsRead(long id)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;
            var userId = long.Parse(userIdString);
            var role = User.FindFirst(ClaimTypes.Role)!.Value;

            var notification = await _dbContext.Notifications.FirstOrDefaultAsync(n => n.Id == id);
            if (notification == null)
            {
                return NotFound("Notification not found");
            }

            if (role == "Customer" && notification.UserId != userId)
            {
                return NotFound("Notification not found");
            }
            if (role == "Admin" && notification.UserId != null)
            {
                return NotFound("Notification not found");
            }

            notification.IsRead = true;
            await _dbContext.SaveChangesAsync();

            return Ok("Notification marked as read");
        }
    }
}