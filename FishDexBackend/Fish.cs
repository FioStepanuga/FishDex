using FishDex.Models;
using Npgsql;

namespace FishDex
{
    public class Fish
    {
        private readonly string _connectionString;

        public Fish(string connectionString)
        {
            _connectionString = connectionString;
        }

        public List<string> GetAllSpecies()
        {
            string sql = "SELECT fish_name FROM fish ORDER BY fish_name;";
            var species = new List<string>();

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            species.Add(reader.GetString(0));
                        }
                    }
                }
            }
            return species;
        }

        //--------------------------------------------------------------------------------------------------------------------------


        public int GetFishIdByName(string fishName)
        {
            string sql = "SELECT fish_id FROM fish WHERE fish_name = @fishName;";

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("fishName", fishName);
                    var result = cmd.ExecuteScalar();
                    return result != null ? (int)result : -1;
                }
            }
        }

        public void AddCaughtFish(int userId, int fishId)
        {
            // ON CONFLICT DO NOTHING means if already caught, silently ignore
            string sql = @"INSERT INTO caught_fish (user_id, fish_id) 
                   VALUES (@userId, @fishId)
                   ON CONFLICT (user_id, fish_id) DO NOTHING;";

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("userId", userId);
                    cmd.Parameters.AddWithValue("fishId", fishId);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public List<int> GetCaughtFishIds(int userId)
        {
            string sql = "SELECT fish_id FROM caught_fish WHERE user_id = @userId;";
            var caughtIds = new List<int>();

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("userId", userId);
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            caughtIds.Add(reader.GetInt32(0));
                        }
                    }
                }
            }
            return caughtIds;
        }
        //-------------------------------------------------------------------------------------------------------------------------------
        public List<FishModel> GetFishByRegion(int regionId)
        {
            string sql = @"
        SELECT f.fish_id, f.fish_name, f.habitat, f.description
        FROM fish f
        JOIN fish_regions fr ON f.fish_id = fr.fish_id
        WHERE fr.region_id = @regionId
        ORDER BY f.fish_name;";

            var fishList = new List<FishModel>();

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("regionId", regionId);
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            fishList.Add(new FishModel
                            {
                                FishId = reader.GetInt32(0),
                                FishName = reader.GetString(1),
                                Habitat = reader.IsDBNull(2) ? "" : reader.GetString(2),
                                Description = reader.IsDBNull(3) ? "" : reader.GetString(3)
                            });
                        }
                    }
                }
            }
            return fishList;
        }

        public List<string> GetFishRegions(int fishId)
        {
            string sql = @"
        SELECT r.region_name 
        FROM regions r
        JOIN fish_regions fr ON r.region_id = fr.region_id
        WHERE fr.fish_id = @fishId
        ORDER BY r.region_name;";

            var regions = new List<string>();

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("fishId", fishId);
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            regions.Add(reader.GetString(0));
                        }
                    }
                }
            }
            return regions;
        }

        //-------------------------------------------------------------------------------------------------------------------------------

        public object GetUserProgress(int userId)
        {
            string sql = @"
        SELECT 
            (SELECT COUNT(*) FROM fish) as total,
            (SELECT COUNT(*) FROM caught_fish WHERE user_id = @userId) as caught";

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("userId", userId);
                    using (var reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return new
                            {
                                total = reader.GetInt64(0),
                                caught = reader.GetInt64(1)
                            };
                        }
                    }
                }
            }
            return new { total = 0, caught = 0 };
        }

        public object GetRegionProgress(int userId, int regionId)
        {
            string sql = @"
        SELECT 
            (SELECT COUNT(*) FROM fish_regions WHERE region_id = @regionId) as total,
            (SELECT COUNT(*) FROM caught_fish cf
             JOIN fish_regions fr ON cf.fish_id = fr.fish_id
             WHERE cf.user_id = @userId AND fr.region_id = @regionId) as caught";

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("userId", userId);
                    cmd.Parameters.AddWithValue("regionId", regionId);
                    using (var reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return new
                            {
                                total = reader.GetInt64(0),
                                caught = reader.GetInt64(1)
                            };
                        }
                    }
                }
            }
            return new { total = 0, caught = 0 };
        }

        //----------------------------------------------------------------------------------------------------------------------------
        public List<FishModel> GetAllFishWithCaughtStatus(int userId)
        {
            string sql = @"
        SELECT 
            f.fish_id,
            f.fish_name,
            f.habitat,
            f.description,
            CASE WHEN cf.fish_id IS NOT NULL THEN true ELSE false END as is_caught
        FROM fish f
        LEFT JOIN caught_fish cf ON f.fish_id = cf.fish_id AND cf.user_id = @userId
        ORDER BY f.fish_name;";

            var fishList = new List<FishModel>();

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("userId", userId);
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            fishList.Add(new FishModel
                            {
                                FishId = reader.GetInt32(0),
                                FishName = reader.GetString(1),
                                Habitat = reader.IsDBNull(2) ? "" : reader.GetString(2),
                                Description = reader.IsDBNull(3) ? "" : reader.GetString(3),
                                IsCaught = reader.GetBoolean(4)
                            });
                        }
                    }
                }
            }
            return fishList;
        }
        //-----------------------------------------------------------------------------------------------------------------------
    }
}