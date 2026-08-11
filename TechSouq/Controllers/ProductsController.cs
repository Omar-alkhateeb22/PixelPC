using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PixelPC.DTOs.ProductsDtos;
using PixelPC.Models;
using System.Security.Claims;

namespace PixelPC.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private PixelPCDbContext _dbContext;

        public ProductsController(PixelPCDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet("GetAllProducts")]
        public async Task<IActionResult> GetAllProducts([FromQuery] ProductFilterDto dto)
        {
            var data = from product in _dbContext.Products
                       from category in _dbContext.Categories.Where(c => c.Id == product.CategoryId).DefaultIfEmpty()
                       where
                             (dto.CategoryId == null || product.CategoryId == dto.CategoryId) &&
                             (dto.Brand == null || product.Brand.ToUpper().Contains(dto.Brand.ToUpper())) &&
                             (dto.MinPrice == null || _dbContext.ProductVariants.Any(v => v.ProductId == product.Id && v.Price >= dto.MinPrice)) &&
                             (dto.MaxPrice == null || _dbContext.ProductVariants.Any(v => v.ProductId == product.Id && v.Price <= dto.MaxPrice))
                       orderby product.Id
                       select new
                       {
                           product.Id,
                           product.Name,
                           product.Brand,
                           product.Description,
                           product.ImageUrl,   // ⬅️ ضيف هذا
                           CategoryId = product.CategoryId,
                           CategoryName = category.Name

                       };

            var result = await data.ToListAsync();
            return Ok(result);
        }

        [HttpGet("GetProductByID")]
        public async Task<IActionResult> GetProductByID(long id)
        {
            var producte = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (producte == null)
            {
                return NotFound();
            }

            var product = await (from p in _dbContext.Products
                                 from c in _dbContext.Categories.Where(x => x.Id == p.CategoryId).DefaultIfEmpty()
                                 where p.Id == id
                                 select new
                                 {
                                     p.Id,
                                     p.Name,
                                     p.Brand,
                                     p.Description,
                                     p.ImageUrl,   // ⬅️ ضيف هذا
                                     CategoryId = p.CategoryId,
                                     CategoryName = c.Name
                                 }).FirstOrDefaultAsync();

            var variants = await (from v in _dbContext.ProductVariants
                                  where v.ProductId == id
                                  select new
                                  {
                                      v.Id,
                                      v.StockKeepingUnit,
                                      v.Price,
                                      v.StockQuantity,
                                      v.ReorderLevel,  
                                      v.AttributesJson
                                  }).ToListAsync();
            var query = new
            {
                product.Id,
                product.Name,
                product.Brand,
                product.Description,
                product.ImageUrl,
                product.CategoryId,
                product.CategoryName,
                Variants = variants
            };
            return Ok(query);
        }

        [HttpPost("CreateProduct")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateProduct(CreateProductDto dto)
        {
            var UserIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var UserId = int.Parse(UserIdString);

            var product = new Product
            {
                Name = dto.Name,
                Brand = dto.Brand,
                Description = dto.Description,
                CategoryId = dto.CategoryId,
                    ImageUrl = dto.ImageUrl   // ⬅️ ضيف هذا

            };

            _dbContext.Products.Add(product);
            await _dbContext.SaveChangesAsync();
            return Ok(product);
        }
        [HttpPut("UpdateProduct")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProduct(UpdateProductDto dto, long id)
        {
            var UserIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var UserId = int.Parse(UserIdString);

            var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                return NotFound();
            }
            product.Name = dto.Name;
            product.Brand = dto.Brand;
            product.Description = dto.Description;
            product.CategoryId = dto.CategoryId;
            product.ImageUrl = dto.ImageUrl;   

            await _dbContext.SaveChangesAsync();
            return Ok(product);

        }
        [HttpDelete("DeleteProduct")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProduct(long id)
        {
            var UserIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var UserId = int.Parse(UserIdString);

            var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                return NotFound();
            }
            _dbContext.Products.Remove(product);
            await _dbContext.SaveChangesAsync();
            return Ok(product);
        }

        [HttpPost("CreateVariant")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateVariant(long id, CreateVariantDto dto)
        {
            var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                return NotFound();
            }

            var variant = new ProductVariant
            {
                ProductId = id,
                StockKeepingUnit = dto.StockKeepingUnit,
                AttributesJson = dto.AttributesJson,
                Price = dto.Price,
                StockQuantity = dto.StockQuantity,
                ReorderLevel = dto.ReorderLevel
            };

            _dbContext.ProductVariants.Add(variant);
            await _dbContext.SaveChangesAsync();

            var result = new
            {
                variant.Id,
                variant.StockKeepingUnit,
                variant.AttributesJson,
                variant.Price,
                variant.StockQuantity,
                variant.ReorderLevel
            };

            return Ok(result);
        }

        [HttpPut("UpdateVariant")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateVariant(long id, UpdateVariantDto dto)
        {
            var UserIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var UserId = int.Parse(UserIdString);

            var variant = await _dbContext.ProductVariants.FirstOrDefaultAsync(p => p.Id == id);
            if (variant == null)
            {
                return NotFound();
            }
            variant.StockKeepingUnit = dto.StockKeepingUnit;
            variant.AttributesJson = dto.AttributesJson;
            variant.Price = dto.Price;
            variant.StockQuantity = dto.StockQuantity;
            variant.ReorderLevel = dto.ReorderLevel;

            await _dbContext.SaveChangesAsync();
            return Ok(variant);
        }
        [HttpDelete("DeleteVariant")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteVariant(long id)
        {
            var UserIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var UserId = int.Parse(UserIdString);

            var variant = await _dbContext.ProductVariants.FirstOrDefaultAsync(v => v.Id == id);
            if (variant == null)
            {
                return NotFound();
            }
            _dbContext.ProductVariants.Remove(variant);
            await _dbContext.SaveChangesAsync();
            return Ok(variant); //
        }
        [HttpPost("UploadImage")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadProductImage(long id, IFormFile file)
        {
            var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                return NotFound("Product not found");
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            // تحقق بسيط من نوع الملف
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest("Only image files are allowed (jpg, jpeg, png, webp)");
            }

            // اسم ملف فريد حتى ما يصير تعارض بين منتجات مختلفة
            var fileName = $"product_{id}_{Guid.NewGuid()}{extension}";
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // نخزن بس المسار النسبي بقاعدة البيانات
            product.ImageUrl = $"/images/{fileName}";
            await _dbContext.SaveChangesAsync();

            return Ok(new { imageUrl = product.ImageUrl });
        }
    }
}
