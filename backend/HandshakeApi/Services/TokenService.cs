using System.Collections.Concurrent;

namespace HandshakeApi.Services;


public class TokenService
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromSeconds(20);

    // token => wanneer die verloopt + voor welke student
    private readonly ConcurrentDictionary<string, ActiveToken> _tokens = new();

    public string Generate(int studentId)
    {
        var token = $"student:{studentId}:{Guid.NewGuid()}";
        var expiresAt = DateTime.UtcNow.Add(Lifetime);
        _tokens[token] = new ActiveToken(studentId, expiresAt);
        return token;
    }

    public bool TryConsume(string token, out int studentId, out string error)
    {
        studentId = 0;
        error = "";

        if (!_tokens.TryGetValue(token, out var active))
        {
            error = "Token onbekend of al gebruikt";
            return false;
        }

        if (DateTime.UtcNow > active.ExpiresAt)
        {
            _tokens.TryRemove(token, out _);
            error = "Token verlopen";
            return false;
        }

        // Eénmalig gebruik: token wordt verwijderd zodra hij geconsumeerd is.
        _tokens.TryRemove(token, out _);
        studentId = active.StudentId;
        return true;
    }

    private record ActiveToken(int StudentId, DateTime ExpiresAt);
}
