namespace PixelPC.DTOs.ProductsDtos
{
    public class ProductFilterDto
    {
        public long? CategoryId { get; set; }
        public string? Brand { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
    }
}
