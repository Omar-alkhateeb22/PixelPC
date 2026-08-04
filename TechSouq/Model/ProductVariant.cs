using System.ComponentModel.DataAnnotations.Schema;

namespace PixelPC.Models
{
    public class ProductVariant
    {
        public long Id { get; set; }

        [ForeignKey("Product")]
        public long ProductId { get; set; }
        public Product? Product { get; set; } 

        public string StockKeepingUnit { get; set; }        
        public string AttributesJson { get; set; } 
        public decimal Price { get; set; }
        public long StockQuantity { get; set; }
        public long ReorderLevel { get; set; }                  

    }
}
