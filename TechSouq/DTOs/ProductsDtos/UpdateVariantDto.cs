namespace PixelPC.DTOs.ProductsDtos
{
    public class UpdateVariantDto
    {
        public string StockKeepingUnit { get; set; }
        public string AttributesJson { get; set; }
        public decimal Price { get; set; }
        public long StockQuantity { get; set; }
        public long ReorderLevel { get; set; }
    }
}
