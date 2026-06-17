using FishDex.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FishDex.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]  // every endpoint in this controller requires a valid token
    public class LogController : ControllerBase
    {
        private readonly string _connectionString = "Host=localhost;Port=5432;Username=postgres;Password=FioTennisPro7002!;Database=fishdex";

        // GET api/Log — fetch all logs for the logged in user
        [HttpGet]
        public IActionResult Get()
        {
            // Read user_id straight from the token
            var userIdClaim = User.FindFirst("userId")?.Value;

            if (userIdClaim == null)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            int userId = int.Parse(userIdClaim);

            var logManager = new Logs(_connectionString);
            var logs = logManager.GetUserLogs(userId);

            return Ok(logs);
        }

        // POST api/Log — add a new log for the logged in user
        [HttpPost]
        public IActionResult Post([FromBody] Log log)
        {
            // Read user_id straight from the token
            var userIdClaim = User.FindFirst("userId")?.Value;

            if (userIdClaim == null)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            int userId = int.Parse(userIdClaim);

            var logManager = new Logs(_connectionString);
            logManager.InsertLog(userId, log);

            return Ok(new { message = "Log added successfully" });
        }

        // DELETE api/Log/5
        [HttpDelete("{logId}")]
        public IActionResult Delete(int logId)
        {
            var userIdClaim = User.FindFirst("userId")?.Value;

            if (userIdClaim == null)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            int userId = int.Parse(userIdClaim);

            var logManager = new Logs(_connectionString);
            logManager.DeleteLog(logId, userId);

            return Ok(new { message = "Log deleted successfully" });
        }

        // PUT api/Log/5
        [HttpPut("{logId}")]
        public IActionResult Put(int logId, [FromBody] Log log)
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (userIdClaim == null)
                return Unauthorized(new { message = "Invalid token" });

            int userId = int.Parse(userIdClaim);

            var logManager = new Logs(_connectionString);
            logManager.UpdateLog(logId, userId, log);

            return Ok(new { message = "Log updated successfully" });
        }
    }
}