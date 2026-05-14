using Npgsql;

namespace FishDex
{
    public class Logs
    {

        private readonly string _connectionString;

        public Logs(string connectionString)
        {
            _connectionString = connectionString;
        }

        public void GetUserLogs(int id)
        {
            // Added spaces/newlines so the words don't run together
            string sql = @"
        SELECT u.username, l.species, l.weight, l.length, l.location, l.description, l.caught_at 
        FROM logs l
        JOIN users u ON l.user_id = u.user_id
        WHERE u.user_id = @id
        ORDER BY l.caught_at DESC;";

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("id", id);
                    using (var reader = cmd.ExecuteReader())
                    {
                        Console.WriteLine($"--- Log History for User {id} ---");

                        // Check if we even found anything
                        if (!reader.HasRows)
                        {
                            Console.WriteLine("No logs found for this user.");
                            return;
                        }

                        while (reader.Read())
                        {
                            string username = reader.GetString(0);
                            string species = reader.GetString(1);
                            decimal weight = reader.GetDecimal(2);
                            decimal length = reader.GetDecimal(3);
                            string location = reader.GetString(4);

                            // SAFE NULL CHECK: If description is null, use "No description"
                            string description = reader.IsDBNull(5) ? "No description" : reader.GetString(5);

                            DateTime date = reader.GetDateTime(6);

                            Console.WriteLine($"[{date:yyyy-MM-dd}] {species} ({weight}lbs, {length}in)");
                            Console.WriteLine($"   Location: {location}");
                            Console.WriteLine($"   Notes: {description}");
                            Console.WriteLine(new string('-', 30));
                        }
                    }
                }
            }
        }
    }
}
