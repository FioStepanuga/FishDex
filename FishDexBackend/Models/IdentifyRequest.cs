namespace FishDex.Models
{
    public class IdentifyRequest
    {
        public string ImageBase64 { get; set; }  // base64 encoded image
        public string MimeType { get; set; }     // "image/jpeg" or "image/png"

        public double? Latitude { get; set; }  
        public double? Longitude { get; set; }  
    }
}