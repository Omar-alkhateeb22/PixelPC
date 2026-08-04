using System.ComponentModel.DataAnnotations.Schema;

namespace PixelPC.Models
{
    public class Invoice
    {
        public long Id { get; set; }

        [ForeignKey("Order")]
        public long OrderId { get; set; }       
        public Order? Order { get; set; } 

        public string InvoiceNumber { get; set; } 
        public DateTime IssueDate { get; set; } = DateTime.UtcNow;
        public decimal TotalAmount { get; set; }
        public string? PdfUrl { get; set; }
    }
}
