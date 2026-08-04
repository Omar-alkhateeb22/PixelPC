using System.ComponentModel.DataAnnotations.Schema;

namespace PixelPC.Models
{
    public class Order
    {
        public long Id { get; set; }

        [ForeignKey("User")]
        public long UserId { get; set; }
        public User? User { get; set; } 

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } 
        public decimal TotalAmount { get; set; }
        public string ShippingAddress { get; set; }

    }
}
