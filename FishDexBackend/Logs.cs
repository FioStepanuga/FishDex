using Npgsql;
using FishDex.Models;

namespace FishDex
{
    public class Logs
    {
        private readonly string _connectionString;

        public Logs(string connectionString)
        {
            _connectionString = connectionString;
        }

        public List<Log> GetUserLogs(int userId)
        {
            string sql = @"
                SELECT l.log_id, l.species, l.weight, l.length, l.location, l.description, l.caught_at 
                FROM logs l
                JOIN users u ON l.user_id = u.user_id
                WHERE u.user_id = @id
                ORDER BY l.caught_at DESC;";

            var logs = new List<Log>();  // list to collect results

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("id", userId);
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            logs.Add(new Log
                            {
                                LogId = reader.GetInt32(0),
                                Species = reader.GetString(1),
                                Weight = reader.GetDecimal(2),
                                Length = reader.GetDecimal(3),
                                Location = reader.GetString(4),
                                Description = reader.IsDBNull(5) ? "No description" : reader.GetString(5),
                                CaughtAt = reader.GetDateTime(6)
                            });
                        }
                    }
                }
            }
            return logs; 
        }

        //-------------------------------------------------------------------------------------------------------------------------------------------

        public void InsertLog(int userId, Log log)
        {
            string sql = @"
                INSERT INTO logs (user_id, species, weight, length, location, description, caught_at)
                VALUES (@userId, @species, @weight, @length, @location, @description, @caughtAt)";

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("userId", userId);
                    cmd.Parameters.AddWithValue("species", log.Species);
                    cmd.Parameters.AddWithValue("weight", log.Weight);
                    cmd.Parameters.AddWithValue("length", log.Length);
                    cmd.Parameters.AddWithValue("location", log.Location);
                    cmd.Parameters.AddWithValue("description", log.Description ?? "");
                    cmd.Parameters.AddWithValue("caughtAt", log.CaughtAt);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        
        //-------------------------------------------------------------------------------------------------------------------------------------------
        

        public void DeleteLog(int logId, int userId)
        {
            // userId check makes sure users can only delete their OWN logs
            string sql = "DELETE FROM logs WHERE log_id = @logId AND user_id = @userId;";

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("logId", logId);
                    cmd.Parameters.AddWithValue("userId", userId);
                    cmd.ExecuteNonQuery();
                }
            }
        }
    }
}

//-------------------------------------------------------------------------------------------------------------------------------------------