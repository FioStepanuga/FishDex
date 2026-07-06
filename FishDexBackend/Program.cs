using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace FishDex
{
    public class Program
    {
        public static void Main(string[] args)

        {

            string connectionString = "Host=localhost;Port=5432;Username=postgres;Password=FioTennisPro7002!;Database=fishdex";
            var userManager = new Users(connectionString);
            var logManager = new Logs(connectionString);






            //--------------------------------------------------------------------------------------------------------------------------
            //Use JWT authentication. Check if the token was signed with the secret JWT key.

            var builder = WebApplication.CreateBuilder(args);

            var jwtKey = builder.Configuration["JwtKey"];
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                        ValidateIssuer = false,   //in production I need to make sure this is the servers URL
                        ValidateAudience = false //in production I need to make sure this is the app URL
                    };
                });




            builder.WebHost.ConfigureKestrel(options =>
            {
                options.ListenAnyIP(5177); // This allows the 10.0.2.2 bridge to connect
            });

            // Add services to the container.

            builder.Services.AddControllers();
            // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
            builder.Services.AddOpenApi();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
            }

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();



        }
    }
}
