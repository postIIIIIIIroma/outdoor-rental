namespace RentalApi.Models;

public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string? Email { get; set; }
    public DateTime? CreatedAt { get; set; }
    public List<Rental> Rentals { get; set; } = new();
}

public class EquipmentCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public List<EquipmentItem> Items { get; set; } = new();
}

public class EquipmentItem
{
    public int Id { get; set; }
    public int? CategoryId { get; set; }
    public EquipmentCategory? Category { get; set; }
    public string ModelName { get; set; } = "";
    public string? SerialNumber { get; set; }
    public string? Size { get; set; }
    public string? Status { get; set; }
    public decimal? HourlyRate { get; set; }
    public List<RentalItem> RentalItems { get; set; } = new();
    public List<SafetyInspection> Inspections { get; set; } = new();
}

public class Rental
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public User? User { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public decimal? TotalPrice { get; set; }
    public string? Status { get; set; }
    public List<RentalItem> Items { get; set; } = new();
}

public class RentalItem
{
    public int Id { get; set; }
    public int? RentalId { get; set; }
    public Rental? Rental { get; set; }
    public int? EquipmentId { get; set; }
    public EquipmentItem? Equipment { get; set; }
    public string? WearConditionReturned { get; set; }
}

public class SafetyInspection
{
    public int Id { get; set; }
    public int? EquipmentId { get; set; }
    public EquipmentItem? Equipment { get; set; }
    public DateTime? InspectedAt { get; set; }
    public string? InspectorName { get; set; }
    public bool? IsSafe { get; set; }
    public string? Notes { get; set; }
}

// VIEW active_rentals_view
public class ActiveRentalView
{
    public string LastName { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string ModelName { get; set; } = "";
    public DateTime StartTime { get; set; }
}
