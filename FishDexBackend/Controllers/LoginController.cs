using FishDex.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FishDex.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly string _connectionString = "Host=localhost;Port=5432;Username=postgres;Password=FioTennisPro7002!;Database=fishdex";
        private readonly string _jwtKey;

        public LoginController(IConfiguration configuration)
        {
            _jwtKey = configuration["JwtKey"];
        }

        [HttpPost]
        public IActionResult Post([FromBody] UserLogin login)
        {
            var userManager = new Users(_connectionString);
            var username = userManager.GetUser(login.UserName, login.Password);

            if (username == null)
            {
                return Unauthorized(new { message = "Invalid username or password" });
            }

            // Generate JWT token
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtKey);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, username)  // store username inside token
                }),
                Expires = DateTime.UtcNow.AddDays(7),    // token lasts 7 days
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            
            var tokenString = tokenHandler.WriteToken(token);
            userManager.SaveToken(username, tokenString);
            return Ok(new { token = tokenString, username = username });
        }
    }
}