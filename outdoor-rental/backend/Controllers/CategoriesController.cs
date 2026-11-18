using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalApi.Data;
using RentalApi.Dtos;
using RentalApi.Models;

namespace RentalApi.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List() => Ok(await db.Categories.OrderBy(c => c.Name)
        .Select(c => new { c.Id, c.Name, c.Description, ItemsCount = c.Items.Count }).ToListAsync());

    [HttpPost]
    public async Task<IActionResult> Create(CategoryDto dto)
    {
        if (!await CheckAsync(dto, null)) return ValidationProblem(ModelState);
        var c = new EquipmentCategory();
        dto.ApplyTo(c);
        db.Categories.Add(c);
        await db.SaveChangesAsync();
        return Ok(new { c.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CategoryDto dto)
    {
        var c = await db.Categories.FindAsync(id);
        if (c is null) return NotFound();
        if (!await CheckAsync(dto, id)) return ValidationProblem(ModelState);
        dto.ApplyTo(c);
        await db.SaveChangesAsync();
        return Ok(new { c.Id });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await db.Categories.FindAsync(id);
        if (c is null) return NotFound();
        if (await db.EquipmentItems.AnyAsync(e => e.CategoryId == id))
            return Conflict(new { message = "Неможливо видалити: у категорії є спорядження" });
        db.Categories.Remove(c);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> CheckAsync(CategoryDto dto, int? id)
    {
        var name = dto.Name!.Trim().ToLower();
        if (await db.Categories.AnyAsync(c => c.Name.ToLower() == name && c.Id != id))
            ModelState.AddModelError(nameof(dto.Name), "Категорія з такою назвою вже існує");
        return ModelState.IsValid;
    }
}
