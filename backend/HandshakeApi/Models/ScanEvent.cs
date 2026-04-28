using System;
namespace HandshakeApi.Models;

public class ScanEvent
{

    public int Id { get; set; }
    public int StudentId { get; set; }
    public int CompanyId { get; set; }
    public DateTime ScannedAt { get; set; }
    public bool IsOfflineSynced { get; set; }

}

