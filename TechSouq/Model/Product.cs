using System.ComponentModel.DataAnnotations.Schema;

namespace PixelPC.Models
{
    public class Product
    {
        public long Id { get; set; }
        public string Name { get; set; } 
        public string Brand { get; set; } 
        public string Description { get; set; }

        [ForeignKey("Category")]
        public long CategoryId { get; set; }
        public Category? Category { get; set; }
        public string? ImageUrl { get; set; }   

    }
}
