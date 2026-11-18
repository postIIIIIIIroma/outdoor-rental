using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalApi.Data;
using RentalApi.Dtos;
using RentalApi.Models;

namespace RentalApi.Controllers;

[ApiController]
[Route("api/equipment")]
public class EquipmentController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(string? search, int? categoryId, string? status, string? sort, string? dir,
        int page = 1, int pageSize = 10)
    {
        var q = db.EquipmentItems.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = $"%{search.Trim()}%";
            q = q.Where(e => EF.Functions.ILike(e.ModelName, s) || (e.SerialNumber != null && EF.Functions.ILike(e.SerialNumber, s)));
        }
        if (categoryId.HasValue) q = q.Where(e => e.CategoryId == categoryId);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(e => e.Status == status);

        var desc = dir == "desc";
        var sorted = sort switch
        {
            "id" => q.SortBy(e => e.Id, desc),
            "serialNumber" => q.SortBy(e => e.SerialNumber, desc),
            "category" => q.SortBy(e => e.Category!.Name, desc),
            "size" => q.SortBy(e => e.Size, desc),
            "hourlyRate" => q.SortBy(e => e.HourlyRate, desc),
            "status" => q.SortBy(e => e.Status, desc),
            _ => q.SortBy(e => e.ModelName, desc),
        };
        var result = await sorted.ThenBy(e => e.Id).Select(e => new
        {
            e.Id, e.ModelName, e.SerialNumber, e.Size, e.Status, e.HourlyRate, e.CategoryId,
            CategoryName = e.Category != null ? e.Category.Name : null
        }).ToPagedAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var e = await db.EquipmentItems.Where(x => x.Id == id).Select(x => new
        {
            x.Id, x.ModelName, x.SerialNumber, x.Size, x.Status, x.HourlyRate, x.CategoryId,
            CategoryName = x.Category != null ? x.Category.Name : null,
            Inspections = x.Inspections.OrderByDescending(i => i.InspectedAt)
                .Select(i => new { i.Id, i.InspectedAt, i.InspectorName, i.IsSafe, i.Notes }).ToList(),
            Rentals = x.RentalItems.OrderByDescending(ri => ri.Rental!.StartTime).Select(ri => new
            {
                ri.RentalId, ri.WearConditionReturned,
                StartTime = ri.Rental!.StartTime, EndTime = ri.Rental.EndTime, Status = ri.Rental.Status,
                UserName = ri.Rental.User != null ? ri.Rental.User.LastName + " " + ri.Rental.User.FirstName : null
            }).ToList()
        }).FirstOrDefaultAsync();
        return e is null ? NotFound() : Ok(e);
    }

    [HttpPost]
    public async Task<IActionResult> Create(EquipmentDto dto)
    {
        if (!await CheckAsync(dto, null)) return ValidationProblem(ModelState);
        var e = new EquipmentItem();
        dto.ApplyTo(e);
        db.EquipmentItems.Add(e);
        await db.SaveChangesAsync();
        return Ok(new { e.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, EquipmentDto dto)
    {
        var e = await db.EquipmentItems.FindAsync(id);
        if (e is null) return NotFound();
        if (!await CheckAsync(dto, id)) return ValidationProblem(ModelState);
        dto.ApplyTo(e);
        await db.SaveChangesAsync();
        return Ok(new { e.Id });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var e = await db.EquipmentItems.Include(x => x.Inspections).FirstOrDefaultAsync(x => x.Id == id);
        if (e is null) return NotFound();
        if (await db.RentalItems.AnyAsync(r => r.EquipmentId == id))
            return Conflict(new { message = "Неможливо видалити: спорядження є в історії оренд. Встановіть статус «списано»." });
        db.Inspections.RemoveRange(e.Inspections);
        db.EquipmentItems.Remove(e);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> CheckAsync(EquipmentDto dto, int? id)
    {
        if (!await db.Categories.AnyAsync(c => c.Id == dto.CategoryId))
            ModelState.AddModelError(nameof(dto.CategoryId), "Категорію не знайдено");
        var serial = dto.SerialNumber!.Trim();
        if (await db.EquipmentItems.AnyAsync(e => e.SerialNumber == serial && e.Id != id))
            ModelState.AddModelError(nameof(dto.SerialNumber), "Такий серійний номер вже існує");
        return ModelState.IsValid;
    }
}
