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
    }
}