namespace FishDex.Models
{
    public class FishModel
    {
        public int FishId { get; set; }
        public string FishName { get; set; }
        public string Habitat { get; set; }
        public string Description { get; set; }
        public bool IsCaught { get; set; }
        public List<string> Regions { get; set; } = new List<string>();
    }
}