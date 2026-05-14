using Microsoft.Extensions.Configuration.EnvironmentVariables;
using Npgsql;
using System.Diagnostics;
using BCrypt.Net;

namespace FishDex
{
    public class Users
    {
        private NpgsqlConnection conn;
        private readonly string _connectionString;

        public Users(string connectionString) {
            _connectionString = connectionString;
        }

        public void InsertUser(string username, string password) { // Inserts new user into the database

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

            string sql = "INSERT INTO users (username, \"password\") VALUES (@username, @passwordHash)";

            using (var conn = new NpgsqlConnection(_connectionString)) // creates new connection and opens it
            {
                conn.Open();

                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    try
                    {
                        string cleanUsername = username.Trim().ToLower(); // trims out the spaces and makes the string lowercase

                        cmd.Parameters.AddWithValue("username", cleanUsername);
                        cmd.Parameters.AddWithValue("passwordHash", passwordHash);
                        cmd.ExecuteNonQuery();
                        Console.WriteLine("User registered successfully!");
                    }
                    catch (PostgresException ex) when (ex.SqlState == "23505") // 23505 is the specific code for Unique Violation
                    {
                        Console.WriteLine("Error: That username is already taken. Please choose another.");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"An unexpected error occurred while inserting: {ex.Message}");
                    }

                }
            }
        }


        //----------------------------------------------------------------------------------------------------------------------------------------


        public void DeleteUser(int id)
        {
            string sql = "DELETE FROM users WHERE user_id = @id;";

            using (var conn = new NpgsqlConnection(_connectionString)) // creates new connection and opens it
            {
                conn.Open();

                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    try
                    {
                        cmd.Parameters.AddWithValue("id", id);

                        int rowsAffected = cmd.ExecuteNonQuery();
                        if (rowsAffected == 0) // if the amount of rows stays the same, no user was deleted.
                        {
                            Console.WriteLine("Warning: No user found with that ID.");
                        }
                        else
                        {
                            Console.WriteLine("User deleted successfully.");
                        }
                    }
                    catch(Exception ex)
                    {
                        Console.WriteLine($"An unexpected error occurred while deleting: {ex.Message}");

                    }
                }

            }
        }

        //---------------------------------------------------------------------------------------------------------------------------------------

        public bool GetUser(string username, string enteredPassword)
        {
            string sql = "SELECT \"password\" FROM users WHERE username = @username;";

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("username", username.Trim().ToLower());

                    using (var reader = cmd.ExecuteReader())
                    {
                        if (reader.Read()) // Found a user with that name
                        {
                            string storedHash = reader.GetString(0);

                            // eventually check hash here

                            if (BCrypt.Net.BCrypt.Verify(enteredPassword, storedHash))
                            {
                                Console.WriteLine("Login Successful!");
                                return true;
                            }
                        }
                    }
                }
            }
            Console.WriteLine("Invalid username or password.");
            return false;
        }

        //---------------------------------------------------------------------------------------------------------------------------------------


        public void UpdatePassword(int id, string newPassword)
        {
            string sql = "UPDATE users SET \"password\" = @newPassword WHERE user_id = @id;";

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("newPassword", newPassword);
                    cmd.Parameters.AddWithValue("id", id);

                    int rowsAffected = cmd.ExecuteNonQuery();
                    if (rowsAffected > 0)
                    {
                        Console.WriteLine("Password updated successfully.");
                    }
                    else
                    {
                        Console.WriteLine("Update failed: User ID not found.");
                    }
                }
            }
        }





    }
}
