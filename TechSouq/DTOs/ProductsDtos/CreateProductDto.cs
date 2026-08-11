namespace PixelPC.DTOs.ProductsDtos
{
    public class CreateProductDto
    {
        public string Name { get; set; }
        public string Brand { get; set; }
        public string Description { get; set; }
        public long CategoryId { get; set; }
        public string? ImageUrl { get; set; }   

    }
}
