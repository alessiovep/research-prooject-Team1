using System.Collections.Concurrent;

namespace HandshakeApi.Services;

public class TokenService
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromSeconds(20);

    private readonly ConcurrentDictionary<string, ActiveToken> _tokens = new();

    public string Generate(int studentId)
    {
        var now = DateTime.UtcNow;
        var token = $"student:{studentId}:{Guid.NewGuid()}";
        _tokens[token] = new ActiveToken(studentId, now, now.Add(Lifetime));
        return token;
    }

    public bool TryConsume(string token, out int studentId, out string error)
    {
        return TryConsumeAt(token, DateTime.UtcNow, out studentId, out error);
    }

    public bool TryConsumeAt(string token, DateTime scannedAt, out int studentId, out string error)
    {
        studentId = 0;
        error = "";

        if (!_tokens.TryGetValue(token, out var active))
        {
            error = "Token onbekend of al gebruikt";
            return false;
        }

        if (scannedAt < active.IssuedAt)
        {
            error = "Scan-tijd ligt vóór token-uitgifte";
            return false;
        }

        if (scannedAt > active.ExpiresAt)
        {
            _tokens.TryRemove(token, out _);
            error = "Token was verlopen op moment van scannen";
            return false;
        }

        _tokens.TryRemove(token, out _);
        studentId = active.StudentId;
        return true;
    }

    private record ActiveToken(int StudentId, DateTime IssuedAt, DateTime ExpiresAt);
}
