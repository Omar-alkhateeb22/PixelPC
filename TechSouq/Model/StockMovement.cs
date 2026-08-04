using System.ComponentModel.DataAnnotations.Schema;

namespace PixelPC.Models
{
    public class StockMovement
    {
        public long Id { get; set; }

        [ForeignKey("ProductVariant")]
        public long ProductVariantId { get; set; }
        public ProductVariant? ProductVariant { get; set; }

        public long? OrderId { get; set; }        // nullable -> null for manual/admin adjustments
        public Order? Order { get; set; }

        public string MovementType { get; set; } // In / Out
        public int Quantity { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
