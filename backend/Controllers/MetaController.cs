using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalApi.Data;

namespace RentalApi.Controllers;

[ApiController]
[Route("api")]
public class MetaController(AppDbContext db) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<IActionResult> Stats() => Ok(new
    {
        users = await db.Users.CountAsync(),
        equipment = await db.EquipmentItems.CountAsync(),
        available = await db.EquipmentItems.CountAsync(e => e.Status == "доступний"),
        activeRentals = await db.Rentals.CountAsync(r => r.Status == "активна"),
        activeView = await db.ActiveRentals.OrderBy(a => a.StartTime).ToListAsync()
    });

    [HttpGet("lookups")]
    public async Task<IActionResult> Lookups() => Ok(new
    {
        users = await db.Users.OrderBy(u => u.LastName)
            .Select(u => new { u.Id, Name = u.LastName + " " + u.FirstName + " (" + u.Phone + ")" }).ToListAsync(),
        categories = await db.Categories.OrderBy(c => c.Name).Select(c => new { c.Id, c.Name }).ToListAsync(),
        equipment = await db.EquipmentItems.OrderBy(e => e.ModelName).ThenBy(e => e.SerialNumber)
            .Select(e => new
            {
                e.Id,
                Label = e.ModelName + " · " + (e.Size ?? "-") + " · " + (e.SerialNumber ?? "-"),
                e.Status, e.HourlyRate
            }).ToListAsync()
    });
}
