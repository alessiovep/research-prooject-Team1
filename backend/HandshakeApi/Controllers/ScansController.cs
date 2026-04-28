using HandshakeApi.Data;
using HandshakeApi.Models;
using HandshakeApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HandshakeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScansController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokens;

    public ScansController(AppDbContext db, TokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    public record CreateScanRequest(int CompanyId, string Token, DateTime? ScannedAt);

    [HttpPost]
    public async Task<ActionResult<ScanEvent>> Create(CreateScanRequest request)
    {
        var scannedAt = request.ScannedAt?.ToUniversalTime() ?? DateTime.UtcNow;
        var isOfflineSynced = request.ScannedAt.HasValue;

        if (!_tokens.TryConsumeAt(request.Token, scannedAt, out var studentId, out var error))
            return BadRequest(new { error });

        var student = await _db.Students.FindAsync(studentId);
        if (student == null) return NotFound(new { error = "Student not found" });

        var company = await _db.Companies.FindAsync(request.CompanyId);
        if (company == null) return NotFound(new { error = "Company not found" });

        var scan = new ScanEvent
        {
            StudentId = studentId,
            CompanyId = request.CompanyId,
            ScannedAt = scannedAt,
            IsOfflineSynced = isOfflineSynced
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