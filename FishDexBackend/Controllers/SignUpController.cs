using FishDex.Models;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace FishDex.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SignUpController : ControllerBase
    {

        string connectionString = "Host=localhost;Port=5432;Username=postgres;Password=FioTennisPro7002!;Database=fishdex";

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
            var userManager = new Users(connectionString);
            
            userManager.InsertUser(login.UserName, login.Password);

            return Ok(new { success = true, message = "User inserted successfully" });
        }

        // PUT api/<SignUpController>/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody] string value)
        {
        }

        // DELETE api/<SignUpController>/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
