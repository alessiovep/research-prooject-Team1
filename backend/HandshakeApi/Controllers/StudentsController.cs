using HandshakeApi.Data;
using HandshakeApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HandshakeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public StudentsController(AppDbContext db)
    {
        _db = db;
    }

    public record CreateStudentRequest(string FullName, string Email);

    [HttpPost]
    public async Task<ActionResult<Student>> Create(CreateStudentRequest request)
    {
        var student = new Student
        {
            FullName = request.FullName,
            Email = request.Email
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

        var token = $"student-{student.Id}";

        return new { studentId = student.Id, token };
    }
}
