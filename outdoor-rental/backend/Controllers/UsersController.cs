using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalApi.Data;
using RentalApi.Dtos;
using RentalApi.Models;

namespace RentalApi.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(string? search, string? sort, string? dir, int page = 1, int pageSize = 10)
    {
        var q = db.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = $"%{search.Trim()}%";
            q = q.Where(u => EF.Functions.ILike(u.FirstName, s) || EF.Functions.ILike(u.LastName, s)
                          || EF.Functions.ILike(u.Phone, s) || (u.Email != null && EF.Functions.ILike(u.Email, s)));
        }
        var desc = dir == "desc";
        var sorted = sort switch
        {
            "id" => q.SortBy(u => u.Id, desc),
            "firstName" => q.SortBy(u => u.FirstName, desc),
            "createdAt" => q.SortBy(u => u.CreatedAt, desc),
            "rentalsCount" => q.SortBy(u => u.Rentals.Count, desc),
            _ => q.SortBy(u => u.LastName, desc),
        };
        var result = await sorted.ThenBy(u => u.Id)
            .Select(u => new { u.Id, u.FirstName, u.LastName, u.Phone, u.Email, u.CreatedAt, RentalsCount = u.Rentals.Count })
            .ToPagedAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var u = await db.Users.Where(x => x.Id == id).Select(x => new
        {
            x.Id, x.FirstName, x.LastName, x.Phone, x.Email, x.CreatedAt,
            Rentals = x.Rentals.OrderByDescending(r => r.StartTime).Select(r => new
            {
                r.Id, r.StartTime, r.EndTime, r.TotalPrice, r.Status, ItemsCount = r.Items.Count
            }).ToList()
        }).FirstOrDefaultAsync();
        return u is null ? NotFound() : Ok(u);
    }

    [HttpPost]
    public async Task<IActionResult> Create(UserDto dto)
    {
        if (!await CheckAsync(dto, null)) return ValidationProblem(ModelState);
        var u = new User { CreatedAt = DateTime.Now };
        dto.ApplyTo(u);
        db.Users.Add(u);
        await db.SaveChangesAsync();
        return Ok(new { u.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UserDto dto)
    {
        var u = await db.Users.FindAsync(id);
        if (u is null) return NotFound();
        if (!await CheckAsync(dto, id)) return ValidationProblem(ModelState);
        dto.ApplyTo(u);
        await db.SaveChangesAsync();
        return Ok(new { u.Id });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var u = await db.Users.FindAsync(id);
        if (u is null) return NotFound();
        if (await db.Rentals.AnyAsync(r => r.UserId == id))
            return Conflict(new { message = "Неможливо видалити: у клієнта є оренди" });
        db.Users.Remove(u);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> CheckAsync(UserDto dto, int? id)
    {
        var phone = dto.Phone!.Trim();
        if (await db.Users.AnyAsync(u => u.Phone == phone && u.Id != id))
            ModelState.AddModelError(nameof(dto.Phone), "Клієнт з таким телефоном вже існує");
        return ModelState.IsValid;
    }
}
