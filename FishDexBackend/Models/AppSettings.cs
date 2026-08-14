namespace FishDex.Models
{
    public class ConnectionString
    {
        public string Value { get; set; }
        public ConnectionString(string value) => Value = value;
    }

    public class OpenAISettings
    {
        public string Key { get; set; }
        public OpenAISettings(string key) => Key = key;
    }

    public class JwtSettings
    {
        public string Key { get; set; }
        public JwtSettings(string key) => Key = key;
    }
}