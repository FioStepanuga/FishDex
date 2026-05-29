using FishDex;
using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
public class LogoutController : ControllerBase
{
    private readonly string _connectionString = "Host=localhost;Port=5432;Username=postgres;Password=FioTennisPro7002!;Database=fishdex";

    [HttpDelete]
    public IActionResult Delete([FromBody] string token)
    {
        var userManager = new Users(_connectionString);
        userManager.DeleteToken(token);
        return Ok(new { message = "Logged out successfully" });
    }
}