using FishDex.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace FishDex.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class IdentifyController : ControllerBase
    {
        private readonly string _connectionString = "Host=localhost;Port=5432;Username=postgres;Password=FioTennisPro7002!;Database=fishdex";
        private readonly string _openAIKey;

        public IdentifyController(IConfiguration configuration)
        {
            _openAIKey = configuration["OpenAIKey"];
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] IdentifyRequest request)
        {
            // Get valid species list from database
            var fishManager = new Fish(_connectionString);
            var speciesList = fishManager.GetAllSpecies();
            var speciesFormatted = string.Join(", ", speciesList);

            var prompt = $@"You are a fish identification expert. 
                You must identify the fish in this image.
                You MUST choose from ONLY this exact list: {speciesFormatted}.
                Rules:
                - Reply with ONLY the exact species name from the list, no other words
                - Do not explain your answer
                - Do not say anything except the species name
                - Pick the closest match from the list
                - Only reply with UNKNOWN if the image contains no fish at all";

            // Build OpenAI request
            var openAIRequest = new
            {
                model = "gpt-4o",
                max_tokens = 50,
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = new object[]
                        {
                            new
                            {
                                type = "image_url",
                                image_url = new
                                {
                                    url = $"data:{request.MimeType};base64,{request.ImageBase64}",
                                    detail = "low"  // ← low detail = cheaper, still accurate enough
                                }
                            },
                            new
                            {
                                type = "text",
                                text = prompt
                            }
                        }
                    }
                }
            };

            using var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_openAIKey}");

            var url = "https://api.openai.com/v1/chat/completions";
            var content = new StringContent(JsonSerializer.Serialize(openAIRequest), Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync(url, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            Console.WriteLine($"OpenAI response: {responseBody}");

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode(500, new { message = "OpenAI API error", details = responseBody });
            }

            // Parse OpenAI response
            var json = JsonDocument.Parse(responseBody);
            var identifiedSpecies = json
                .RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString()
                ?.Trim();

            Console.WriteLine($"Identified: '{identifiedSpecies}'");

            if (identifiedSpecies == null || identifiedSpecies == "UNKNOWN")
            {
                return Ok(new { success = false, message = "Could not identify fish" });
            }
            
            
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (userIdClaim != null)
            {
                int userId = int.Parse(userIdClaim);
                int fishId = fishManager.GetFishIdByName(identifiedSpecies);
                if (fishId != -1)
                {
                    fishManager.AddCaughtFish(userId, fishId);
                    Console.WriteLine($"Added {identifiedSpecies} to caught_fish for user {userId}");
                }
            }

            return Ok(new { success = true, species = identifiedSpecies });
        }
    }
}