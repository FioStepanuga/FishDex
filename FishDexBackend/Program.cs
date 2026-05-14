
namespace FishDex
{
    public class Program
    {
        public static void Main(string[] args)

        {


            string connectionString = "Host=localhost;Port=5432;Username=postgres;Password=FioTennisPro7002!;Database=fishdex";
            var userManager = new Users(connectionString);
            var logManager = new Logs(connectionString);

            logManager.GetUserLogs(10);

            //userManager.InsertUser("jdoewife", "password321");
            //userManager.DeleteUser(8);
            //bool found_user = userManager.GetUser("jdoe", "password123");
            //userManager.UpdatePassword(1, "password123");







            var builder = WebApplication.CreateBuilder(args);

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

            //app.UseHttpsRedirection();

            //app.UseAuthorization();


            app.MapControllers();

            app.Run();


        }
    }
}
