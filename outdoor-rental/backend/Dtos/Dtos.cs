using System.ComponentModel.DataAnnotations;
using RentalApi.Models;

namespace RentalApi.Dtos;

public class UserDto
{
    [Required(ErrorMessage = "Імʼя обовʼязкове")]
    [StringLength(50, ErrorMessage = "Максимум 50 символів")]
    public string? FirstName { get; set; }

    [Required(ErrorMessage = "Прізвище обовʼязкове")]
    [StringLength(50, ErrorMessage = "Максимум 50 символів")]
    public string? LastName { get; set; }

    [Required(ErrorMessage = "Телефон обовʼязковий")]
    [RegularExpression(@"^\+380\d{9}$", ErrorMessage = "Формат телефону: +380XXXXXXXXX")]
    public string? Phone { get; set; }

    [EmailAddress(ErrorMessage = "Некоректний email")]
    [StringLength(100, ErrorMessage = "Максимум 100 символів")]
    public string? Email { get; set; }

    public void ApplyTo(User u)
    {
        u.FirstName = FirstName!.Trim();
        u.LastName = LastName!.Trim();
        u.Phone = Phone!.Trim();
        u.Email = Email.Clean();
    }
}

public class CategoryDto
{
    [Required(ErrorMessage = "Назва обовʼязкова")]
    [StringLength(100, ErrorMessage = "Максимум 100 символів")]
    public string? Name { get; set; }

    [StringLength(1000, ErrorMessage = "Максимум 1000 символів")]
    public string? Description { get; set; }

    public void ApplyTo(EquipmentCategory c)
    {
        c.Name = Name!.Trim();
        c.Description = Description.Clean();
    }
}

public class EquipmentDto : IValidatableObject
{
    [Required(ErrorMessage = "Оберіть категорію")]
    public int? CategoryId { get; set; }

    [Required(ErrorMessage = "Назва моделі обовʼязкова")]
    [StringLength(150, ErrorMessage = "Максимум 150 символів")]
    public string? ModelName { get; set; }

    [Required(ErrorMessage = "Серійний номер обовʼязковий")]
    [StringLength(50, ErrorMessage = "Максимум 50 символів")]
    [RegularExpression(@"^[A-Za-z0-9\-]+$", ErrorMessage = "Лише латиниця, цифри та дефіс")]
    public string? SerialNumber { get; set; }

    [StringLength(20, ErrorMessage = "Максимум 20 символів")]
    public string? Size { get; set; }

    [Required(ErrorMessage = "Оберіть статус")]
    public string? Status { get; set; }

    [Required(ErrorMessage = "Вкажіть ціну")]
    [Range(0.01, 100000, ErrorMessage = "Ціна від 0.01 до 100000")]
    public decimal? HourlyRate { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        if (Status != null && !Statuses.Equipment.Contains(Status))
            yield return new ValidationResult("Недопустимий статус", new[] { nameof(Status) });
    }

    public void ApplyTo(EquipmentItem e)
    {
        e.CategoryId = CategoryId;
        e.ModelName = ModelName!.Trim();
        e.SerialNumber = SerialNumber!.Trim();
        e.Size = Size.Clean();
        e.Status = Status;
        e.HourlyRate = HourlyRate;
    }
}

public class InspectionDto
{
    [Required(ErrorMessage = "Вкажіть спорядження")]
    public int? EquipmentId { get; set; }

    [Required(ErrorMessage = "Вкажіть інспектора")]
    [StringLength(100, ErrorMessage = "Максимум 100 символів")]
    public string? InspectorName { get; set; }

    public bool IsSafe { get; set; } = true;

    [StringLength(2000, ErrorMessage = "Максимум 2000 символів")]
    public string? Notes { get; set; }
}

public class RentalItemDto
{
    [Required(ErrorMessage = "Оберіть спорядження")]
    public int? EquipmentId { get; set; }

    [StringLength(100, ErrorMessage = "Максимум 100 символів")]
    public string? WearConditionReturned { get; set; }
}

public class RentalDto : IValidatableObject
{
    [Required(ErrorMessage = "Оберіть клієнта")]
    public int? UserId { get; set; }

    [Required(ErrorMessage = "Вкажіть час початку")]
    public DateTime? StartTime { get; set; }

    public DateTime? EndTime { get; set; }

    [Range(0, 1000000, ErrorMessage = "Сума від 0 до 1 000 000")]
    public decimal? TotalPrice { get; set; }

    [Required(ErrorMessage = "Оберіть статус")]
    public string? Status { get; set; }

    public List<RentalItemDto> Items { get; set; } = new();

    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        if (Status != null && !Statuses.Rental.Contains(Status))
            yield return new ValidationResult("Недопустимий статус", new[] { nameof(Status) });
        if (StartTime.HasValue && EndTime.HasValue && EndTime < StartTime)
            yield return new ValidationResult("Кінець не може бути раніше початку", new[] { nameof(EndTime) });
        if (Status == "завершена" && !EndTime.HasValue)
            yield return new ValidationResult("Для завершеної оренди вкажіть час закінчення", new[] { nameof(EndTime) });
        if (Items.Count == 0)
            yield return new ValidationResult("Додайте хоча б одну позицію", new[] { nameof(Items) });
        if (Items.GroupBy(i => i.EquipmentId).Any(g => g.Count() > 1))
            yield return new ValidationResult("Спорядження в списку повторюється", new[] { nameof(Items) });
    }

    public void ApplyTo(Rental r)
    {
        r.UserId = UserId;
        r.StartTime = StartTime!.Value;
        r.EndTime = EndTime;
        r.TotalPrice = TotalPrice;
        r.Status = Status;
    }
}
