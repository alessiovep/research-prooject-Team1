using HandshakeApi.Data;
using HandshakeApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;

namespace HandshakeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScansController : ControllerBase
{
    private readonly AppDbContext _db;

    public ScansController(AppDbContext db)
    {
        _db = db;
    }

    public record CreateScanRequest(int CompanyId, string Token);

    [HttpPost]
    public async Task<ActionResult<ScanEvent>> Create(CreateScanRequest request)
    {
        // nu enkel token formaat als student id en nadien vervangen met dynamisch token met expiry
        if (!request.Token.StartsWith("student:"))
        return BadRequest(new { error = "invalid token format"});

        var parts = request.Token.Split(':');

        if (parts.Length != 2)
        return BadRequest(new { error = "invalid token format"});

        if (!int.TryParse(parts[1], out var studentId))
        return BadRequest(new { error = "Invalid token payload" });
        
        var student = await _db.Students.FindAsync(studentId);
        if (student == null) return NotFound(new { error = "Student not found" });

        var company = await _db.Companies.FindAsync(request.CompanyId);
        if (company == null) return NotFound(new { error = "Company not found" });

        var scan = new ScanEvent
        {
            StudentId = studentId,
            CompanyId = request.CompanyId,
            ScannedAt = DateTime.UtcNow
        };

        _db.ScanEvents.Add(scan);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = scan.Id }, scan);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ScanEvent>> GetById(int id)
    {
        var scan = await _db.ScanEvents.FindAsync(id);
        if (scan == null) return NotFound();
        return scan;
    }   

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ScanEvent>>> GetAll()
    {
        return await _db.ScanEvents
            .OrderByDescending(s => s.ScannedAt)
            .ToListAsync();
    }
}