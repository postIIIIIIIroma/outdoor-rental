using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalApi.Data;
using RentalApi.Dtos;
using RentalApi.Models;

namespace RentalApi.Controllers;

[ApiController]
[Route("api/rentals")]
public class RentalsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(string? search, string? status, string? sort, string? dir, int page = 1, int pageSize = 10)
    {
        var q = db.Rentals.AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(r => r.Status == status);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = $"%{search.Trim()}%";
            q = q.Where(r => r.User != null && (EF.Functions.ILike(r.User.FirstName, s)
                || EF.Functions.ILike(r.User.LastName, s) || EF.Functions.ILike(r.User.Phone, s)));
        }
        var desc = dir == "desc";
        var sorted = sort switch
        {
            "id" => q.SortBy(r => r.Id, desc),
            "user" => q.SortBy(r => r.User!.LastName, desc),
            "endTime" => q.SortBy(r => r.EndTime, desc),
            "totalPrice" => q.SortBy(r => r.TotalPrice, desc),
            "status" => q.SortBy(r => r.Status, desc),
            "itemsCount" => q.SortBy(r => r.Items.Count, desc),
            _ => q.SortBy(r => r.StartTime, desc),
        };
        var result = await sorted.ThenBy(r => r.Id).Select(r => new
        {
            r.Id, r.UserId, r.StartTime, r.EndTime, r.TotalPrice, r.Status,
            UserName = r.User != null ? r.User.LastName + " " + r.User.FirstName : null,
            ItemsCount = r.Items.Count
        }).ToPagedAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var r = await db.Rentals.Where(x => x.Id == id).Select(x => new
        {
            x.Id, x.UserId, x.StartTime, x.EndTime, x.TotalPrice, x.Status,
            User = x.User == null ? null : new { x.User.Id, x.User.FirstName, x.User.LastName, x.User.Phone, x.User.Email },
            Items = x.Items.OrderBy(i => i.Id).Select(i => new
            {
                i.Id, i.EquipmentId, i.WearConditionReturned,
                ModelName = i.Equipment != null ? i.Equipment.ModelName : null,
                SerialNumber = i.Equipment != null ? i.Equipment.SerialNumber : null,
                Size = i.Equipment != null ? i.Equipment.Size : null,
                HourlyRate = i.Equipment != null ? i.Equipment.HourlyRate : null,
                CategoryName = i.Equipment != null && i.Equipment.Category != null ? i.Equipment.Category.Name : null
            }).ToList()
        }).FirstOrDefaultAsync();
        return r is null ? NotFound() : Ok(r);
    }

    [HttpPost]
    public async Task<IActionResult> Create(RentalDto dto)
    {
        if (!await CheckAsync(dto, null)) return ValidationProblem(ModelState);
        var r = new Rental();
        dto.ApplyTo(r);
        r.Items = dto.Items.Select(i => new RentalItem
        {
            EquipmentId = i.EquipmentId,
            WearConditionReturned = i.WearConditionReturned.Clean()
        }).ToList();
        db.Rentals.Add(r);
        await db.SaveChangesAsync();
        await SyncEquipmentAsync(dto.Items.Select(i => i.EquipmentId!.Value));
        return Ok(new { r.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, RentalDto dto)
    {
        var r = await db.Rentals.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id);
        if (r is null) return NotFound();
        if (!await CheckAsync(dto, id)) return ValidationProblem(ModelState);

        var affected = r.Items.Where(i => i.EquipmentId.HasValue).Select(i => i.EquipmentId!.Value).ToList();
        dto.ApplyTo(r);
        foreach (var old in r.Items.ToList())
            if (!dto.Items.Any(i => i.EquipmentId == old.EquipmentId))
                db.RentalItems.Remove(old);
        foreach (var i in dto.Items)
        {
            var existing = r.Items.FirstOrDefault(x => x.EquipmentId == i.EquipmentId);
            if (existing is null)
                r.Items.Add(new RentalItem { EquipmentId = i.EquipmentId, WearConditionReturned = i.WearConditionReturned.Clean() });
            else
                existing.WearConditionReturned = i.WearConditionReturned.Clean();
        }
        await db.SaveChangesAsync();
        await SyncEquipmentAsync(affected.Concat(dto.Items.Select(i => i.EquipmentId!.Value)));
        return Ok(new { r.Id });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var r = await db.Rentals.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id);
        if (r is null) return NotFound();
        var affected = r.Items.Where(i => i.EquipmentId.HasValue).Select(i => i.EquipmentId!.Value).ToList();
        db.RentalItems.RemoveRange(r.Items);
        db.Rentals.Remove(r);
        await db.SaveChangesAsync();
        await SyncEquipmentAsync(affected);
        return NoContent();
    }

    // Серверна перевірка звʼязаних даних
    private async Task<bool> CheckAsync(RentalDto dto, int? rentalId)
    {
        if (!await db.Users.AnyAsync(u => u.Id == dto.UserId))
            ModelState.AddModelError(nameof(dto.UserId), "Клієнта не знайдено");

        var ids = dto.Items.Where(i => i.EquipmentId.HasValue).Select(i => i.EquipmentId!.Value).Distinct().ToList();
        var equipment = await db.EquipmentItems.Where(e => ids.Contains(e.Id)).ToListAsync();
        if (equipment.Count != ids.Count)
            ModelState.AddModelError(nameof(dto.Items), "Частину спорядження не знайдено");

        if (dto.Status == "активна")
        {
            var busy = await db.RentalItems
                .Where(ri => ri.EquipmentId != null && ids.Contains(ri.EquipmentId.Value)
                             && ri.RentalId != rentalId && ri.Rental!.Status == "активна")
                .Select(ri => ri.Equipment!.ModelName + " (" + ri.Equipment.SerialNumber + ")")
                .ToListAsync();
            if (busy.Count > 0)
                ModelState.AddModelError(nameof(dto.Items), "Вже в іншій активній оренді: " + string.Join(", ", busy));

            var broken = equipment.Where(e => e.Status == "на ТО" || e.Status == "списано")
                .Select(e => $"{e.ModelName} ({e.SerialNumber}) - {e.Status}").ToList();
            if (broken.Count > 0)
                ModelState.AddModelError(nameof(dto.Items), "Недоступне для видачі: " + string.Join(", ", broken));
        }
        return ModelState.IsValid;
    }

    // Оновлює статус спорядження залежно від активних оренд
    private async Task SyncEquipmentAsync(IEnumerable<int> equipmentIds)
    {
        var ids = equipmentIds.Distinct().ToList();
        var items = await db.EquipmentItems.Where(e => ids.Contains(e.Id)).ToListAsync();
        foreach (var e in items)
        {
            var inActive = await db.RentalItems.AnyAsync(ri => ri.EquipmentId == e.Id && ri.Rental!.Status == "активна");
            if (inActive) e.Status = "в оренді";
            else if (e.Status == "в оренді") e.Status = "доступний";
        }
        await db.SaveChangesAsync();
    }
}
