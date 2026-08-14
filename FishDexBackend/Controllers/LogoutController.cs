using FishDex;
using FishDex.Models;
using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
public class LogoutController : ControllerBase
{
    private readonly string _connectionString;


    public LogoutController(IConfiguration configuration, ConnectionString connectionString)
    {
        _connectionString = connectionString.Value;
    }

    [HttpDelete]
    public IActionResult Delete([FromBody] string token)
    {
        var userManager = new Users(_connectionString);
        userManager.DeleteToken(token);
        return Ok(new { message = "Logged out successfully" });
    }
}