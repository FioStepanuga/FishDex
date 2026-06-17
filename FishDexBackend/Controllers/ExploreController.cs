using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FishDex.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ExploreController : ControllerBase
    {
        private readonly string _connectionString = "Host=localhost;Port=5432;Username=postgres;Password=FioTennisPro7002!;Database=fishdex";

        // GET api/Explore/region/3 — get all fish in a region with caught status
        [HttpGet("region/{regionId}")]
        public IActionResult GetRegionFish(int regionId)
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (userIdClaim == null)
                return Unauthorized();

            int userId = int.Parse(userIdClaim);

            var fishManager = new Fish(_connectionString);
            var regionFish = fishManager.GetFishByRegion(regionId);
            var caughtIds = fishManager.GetCaughtFishIds(userId);

            // Mark each fish as caught or not
            var result = regionFish.Select(f => new
            {
                f.FishId,
                f.FishName,
                f.Habitat,
                f.Description,
                IsCaught = caughtIds.Contains(f.FishId)
            });

            return Ok(result);
        }

        // GET api/Explore/progress — overall caught vs total
        [HttpGet("progress")]
        public IActionResult GetProgress()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (userIdClaim == null) return Unauthorized();
            int userId = int.Parse(userIdClaim);

            var fishManager = new Fish(_connectionString);
            var progress = fishManager.GetUserProgress(userId);
            return Ok(progress);
        }

        // GET api/Explore/progress/region/{regionId} — caught vs total per region
        [HttpGet("progress/region/{regionId}")]
        public IActionResult GetRegionProgress(int regionId)
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (userIdClaim == null) return Unauthorized();
            int userId = int.Parse(userIdClaim);

            var fishManager = new Fish(_connectionString);
            var progress = fishManager.GetRegionProgress(userId, regionId);
            return Ok(progress);
        }
    }
}