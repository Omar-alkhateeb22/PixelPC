using System.ComponentModel.DataAnnotations.Schema;

namespace PixelPC.Models
{
    public class Cart
    {
        public long Id { get; set; }

        [ForeignKey("User")]
        public long UserId { get; set; }
        public User? User { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}