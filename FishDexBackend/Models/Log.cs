namespace FishDex.Models
{
    public class Log
    {
        public int LogId { get; set; }
        public string Species { get; set; }
        public decimal Weight { get; set; }
        public decimal Length { get; set; }
        public string Location { get; set; }
        public string Description { get; set; }
        public string? PhotoBase64 { get; set; }
        public DateTime CaughtAt { get; set; }
    }
}