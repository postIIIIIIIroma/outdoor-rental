using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalApi.Data;
using RentalApi.Dtos;
using RentalApi.Models;

namespace RentalApi.Controllers;

[ApiController]
[Route("api/inspections")]
public class InspectionsController(AppDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(InspectionDto dto)
    {
        var eq = await db.EquipmentItems.FindAsync(dto.EquipmentId);
        if (eq is null)
        {
            ModelState.AddModelError(nameof(dto.EquipmentId), "Спорядження не знайдено");
            return ValidationProblem(ModelState);
        }
        var i = new SafetyInspection
        {
            EquipmentId = dto.EquipmentId,
            InspectedAt = DateTime.Now,
            InspectorName = dto.InspectorName!.Trim(),
            IsSafe = dto.IsSafe,
            Notes = dto.Notes.Clean()
        };
        db.Inspections.Add(i);
        if (!dto.IsSafe && eq.Status == "доступний") eq.Status = "на ТО"; // небезпечне - знімаємо з видачі
        await db.SaveChangesAsync();
        return Ok(new { i.Id });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var i = await db.Inspections.FindAsync(id);
        if (i is null) return NotFound();
        db.Inspections.Remove(i);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
