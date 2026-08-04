using System.ComponentModel.DataAnnotations.Schema;

namespace PixelPC.Models
{
    public class Notification
    {
        public long Id { get; set; }

        [ForeignKey("User")]
        public long? UserId { get; set; }    
        public User? User { get; set; }

        public string Type { get; set; } 
        public string Message { get; set; } 
        public bool IsRead { get; set; } 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
