using System.ComponentModel.DataAnnotations.Schema;

namespace PixelPC.Models
{
    public class CartItem
    {
        public long Id { get; set; }

        [ForeignKey("Cart")]
        public long CartId { get; set; }
        public Cart? Cart { get; set; }

        [ForeignKey("ProductVariant")]
        public long ProductVariantId { get; set; }
        public ProductVariant? ProductVariant { get; set; } 

        public int Quantity { get; set; }
    }
}
