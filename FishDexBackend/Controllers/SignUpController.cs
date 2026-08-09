using FishDex.Models;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace FishDex.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SignUpController : ControllerBase
    {

        private readonly string _connectionString;

        public SignUpController(IConfiguration configuration)
        {
            _connectionString = configuration["ConnectionString"];
        }

        // GET: api/<SignUpController>
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET api/<SignUpController>/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }

        // POST api/<SignUpController>
        [HttpPost]
        public IActionResult Post([FromBody] UserLogin login)
        {
            var userManager = new Users(_connectionString);
            bool success = userManager.InsertUser(login.UserName, login.Password);

            if (!success)
            {
                return Conflict(new { message = "Username already taken. Please choose another." });
            }

            return Ok(new { success = true, message = "User registered successfully" });
        }

    }
}
