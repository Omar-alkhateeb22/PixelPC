using Microsoft.EntityFrameworkCore;
using PixelPC.Models;

namespace PixelPC
{
    public class PixelPCDbContext : DbContext
    {
            public PixelPCDbContext(DbContextOptions<PixelPCDbContext> options)
                : base(options)
            {

            }
       public DbSet<User> Users { get; set; }
       public DbSet<StockMovement> StockMovements { get; set; }
       public DbSet<ProductVariant> ProductVariants { get; set; }
       public DbSet<Product> Products { get; set; }
       public DbSet<OrderItem> OrderItems { get; set; }
       public DbSet<Notification> Notifications { get; set; }
       public DbSet<Invoice> Invoices { get; set; }
       public DbSet<Category> Categories { get; set; }
       public DbSet<CartItem> CartItems { get; set; }
       public DbSet<Cart> Carts { get; set; }
       public DbSet<Order> Orders { get; set; }
     

    }
}
