using System.ComponentModel.DataAnnotations.Schema;

namespace PixelPC.Models
{
    public class OrderItem
    {
        public long Id { get; set; }

        [ForeignKey("Order")]
        public long OrderId { get; set; }
        public Order? Order { get; set; }

        [ForeignKey("ProductVariant")]
        public long ProductVariantId { get; set; }
        public ProductVariant? ProductVariant { get; set; } 

        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
