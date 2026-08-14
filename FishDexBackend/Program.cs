using FishDex.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace FishDex
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Now configuration is available via builder.Configuration
            var jwtKey = Environment.GetEnvironmentVariable("JwtKey") 
                ?? builder.Configuration["JwtKey"] 
                ?? throw new InvalidOperationException("JWT key not found");

            var connectionString = Environment.GetEnvironmentVariable("CONNECTION_STRING") 
                ?? builder.Configuration["ConnectionString"]
                ?? throw new InvalidOperationException("ConnectionString not found");

            var openAIKey = Environment.GetEnvironmentVariable("OPENAI_KEY")
                ?? builder.Configuration["OpenAIKey"]
                ?? throw new InvalidOperationException("OpenAI key not found");

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                        ValidateIssuer = false,
                        ValidateAudience = false
                    };
                });

            //builder.Services.AddSingleton(connectionString);
            builder.Services.AddSingleton(new ConnectionString(connectionString));
            builder.Services.AddSingleton(new OpenAISettings(openAIKey));
            builder.Services.AddSingleton(new JwtSettings(jwtKey));


            builder.WebHost.ConfigureKestrel(options =>
            {
                options.ListenAnyIP(5177);
            });

            builder.Services.AddControllers();
            builder.Services.AddOpenApi();

            builder.Services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

                // Security: Clear known networks/proxies if behind a trusted reverse proxy
                options.KnownIPNetworks.Clear();
                options.KnownProxies.Clear();
            });

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
            }

            app.UseForwardedHeaders();
            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();
            app.Run();
        }
    }
}
