using System.ComponentModel.DataAnnotations.Schema;

namespace PixelPC.Models
{
    public class StockMovement
    {
        public long Id { get; set; }


        [ForeignKey("ProductVariant")]
        public long ProductVariantId { get; set; }
        public ProductVariant? ProductVariant { get; set; }


        [ForeignKey("Order")]
        public long? OrderId { get; set; }       
        public Order? Order { get; set; }

        public string MovementType { get; set; } 
        public int Quantity { get; set; }
        public string Reason { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
