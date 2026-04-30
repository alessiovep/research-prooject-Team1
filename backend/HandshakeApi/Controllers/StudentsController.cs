using HandshakeApi.Data;
using HandshakeApi.Models;
using HandshakeApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HandshakeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokens;

    public StudentsController(AppDbContext db, TokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    public record CreateStudentRequest(string FullName, string Email, bool ConsentGiven);

    [HttpPost]
    public async Task<ActionResult<Student>> Create(CreateStudentRequest request)
    {
        if (!request.ConsentGiven)
            return BadRequest(new { error = "Toestemming is vereist" });

        var student = new Student
        {
            FullName = request.FullName,
            Email = request.Email,
            ConsentGivenAt = DateTime.UtcNow
        };

        _db.Students.Add(student);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = student.Id }, student);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Student>> GetById(int id)
    {
        var student = await _db.Students.FindAsync(id);
        if (student is null) return NotFound();
        return student;
    }

    [HttpGet("{id}/qr-token")]
    public async Task<ActionResult<object>> GetQrToken(int id)
    {
        var student = await _db.Students.FindAsync(id);
        if (student is null) return NotFound();

        var token = _tokens.Generate(student.Id);

        return new { studentId = student.Id, token };
    }
}
