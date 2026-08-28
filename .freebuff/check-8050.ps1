try {
    $p = Get-Process -Id 5572 -ErrorAction Stop
    Write-Output "Process alive: $($p.ProcessName) PID=$($p.Id)"
} catch {
    Write-Output "Process 5572 dead"
}

# Try a known working endpoint
try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/api/v5/tarot/daily' -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Output "TAROT: $($r.StatusCode)"
} catch {
    Write-Output "TAROT ERROR: $($_.Exception.Message)"
}

# Try numerology (we know it works)
try {
    $body = '{"year": 1990, "month": 1, "day": 1}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/api/v5/numerology/life-path' -Method POST -Body $bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 5
    Write-Output "NUMEROLOGY: $($r.StatusCode)"
} catch {
    Write-Output "NUMEROLOGY ERROR: $($_.Exception.Message)"
}
