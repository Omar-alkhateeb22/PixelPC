namespace PixelPC.DTOs.StockMovementsDtos
{
    public class AdjustStockDto
    {
        public long ProductVariantId { get; set; }
        public string MovementType { get; set; }   
        public int Quantity { get; set; }
        public string Reason { get; set; }
    }
}