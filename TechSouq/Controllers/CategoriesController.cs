using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PixelPC;
using PixelPC.DTOs.CategoriesDtos;
using PixelPC.Models;
using System.Security.Claims;

namespace PixelPC.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private PixelPCDbContext _dbContext;

        public CategoriesController(PixelPCDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet("GetAllCategories")]
        public async Task<IActionResult> GetAllCategories()
        {
           var categories = await (from c in _dbContext.Categories
                                    select new
                                    {
                                        c.Id,
                                        c.Name
                                    }).ToListAsync();
            return Ok(categories);
        }

        [HttpGet("GetCategoriesByID")]
        public async Task<IActionResult> GetCategoriesByID(long id)
        {
           var category = await _dbContext.Categories.FirstOrDefaultAsync(c => c.Id == id);
            if (category == null)
            {
                return NotFound();
            }

            var categories = await (from c in _dbContext.Categories
                                    where c.Id == category.Id 
                                    select new
                                    {
                                        c.Id,
                                        c.Name,
                                        
                                    }).FirstOrDefaultAsync();
            return Ok(categories);
        }

        [HttpPost("CreateCategory")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory(CreateCategoryDto dto)
        {
            var UserIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var UserId = int.Parse(UserIdString);

            var category = new Category
            {
                Name = dto.Name,
            };
            _dbContext.Categories.Add(category);
            await _dbContext.SaveChangesAsync();
            return Ok(category);
        }

        [HttpPut("UpdateCategory")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(long id, UpdateCategoryDto dto)
        {
            var UserIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var UserId = int.Parse(UserIdString);

            var category = await _dbContext.Categories.FirstOrDefaultAsync(c => c.Id == id);
            if (category == null)
            {
                return NotFound();
            }
            category.Name = dto.Name;

            await _dbContext.SaveChangesAsync();
            return Ok(category);
        }

        [HttpDelete("DeleteCategory")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(long id)
        {
            var UserIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var UserId = int.Parse(UserIdString);

            var category = await _dbContext.Categories.FirstOrDefaultAsync(c => c.Id == id);
            if (category == null)
            {
                return NotFound();
            }
            _dbContext.Categories.Remove(category);
            await _dbContext.SaveChangesAsync();
            return Ok(category);
        }
        }
    }
