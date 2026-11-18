using Microsoft.EntityFrameworkCore;
using RentalApi.Models;

namespace RentalApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<EquipmentCategory> Categories => Set<EquipmentCategory>();
    public DbSet<EquipmentItem> EquipmentItems => Set<EquipmentItem>();
    public DbSet<Rental> Rentals => Set<Rental>();
    public DbSet<RentalItem> RentalItems => Set<RentalItem>();
    public DbSet<SafetyInspection> Inspections => Set<SafetyInspection>();
    public DbSet<ActiveRentalView> ActiveRentals => Set<ActiveRentalView>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().ToTable("users");
        b.Entity<EquipmentCategory>().ToTable("equipment_categories");
        b.Entity<EquipmentItem>(e =>
        {
            e.ToTable("equipment_items");
            e.HasOne(x => x.Category).WithMany(c => c.Items).HasForeignKey(x => x.CategoryId);
        });
        b.Entity<Rental>(e =>
        {
            e.ToTable("rentals");
            e.HasOne(x => x.User).WithMany(u => u.Rentals).HasForeignKey(x => x.UserId);
        });
        b.Entity<RentalItem>(e =>
        {
            e.ToTable("rental_items");
            e.HasOne(x => x.Rental).WithMany(r => r.Items).HasForeignKey(x => x.RentalId);
            e.HasOne(x => x.Equipment).WithMany(q => q.RentalItems).HasForeignKey(x => x.EquipmentId);
        });
        b.Entity<SafetyInspection>(e =>
        {
            e.ToTable("safety_inspections");
            e.HasOne(x => x.Equipment).WithMany(q => q.Inspections).HasForeignKey(x => x.EquipmentId);
        });
        b.Entity<ActiveRentalView>().HasNoKey().ToView("active_rentals_view");
    }
}
