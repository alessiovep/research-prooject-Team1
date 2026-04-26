using HandshakeApi.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace HandshakeApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Student> Students => Set<Student>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<ScanEvent> ScanEvents => Set<ScanEvent>();
}
