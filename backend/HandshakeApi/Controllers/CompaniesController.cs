using HandshakeApi.Data;
using HandshakeApi.Models;
using Microsoft.AspNetCore.Mvc;

namespace HandshakeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CompaniesController(AppDbContext db)
    {
        _db = db;
    }

    public record CreateCompanyRequest(string Name);

    [HttpPost]
    public async Task<ActionResult<Company>> Create(CreateCompanyRequest request)
    {
        var company = new Company { Name = request.Name };
        _db.Companies.Add(company);
        await _db.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetById), new { id = company.Id }, company);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Company>> GetById(int id)
    {
        var company = await _db.Companies.FindAsync(id);
        if (company == null) return NotFound();
        return company;
    }
}

