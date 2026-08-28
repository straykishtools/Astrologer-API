# Check which process is actually responding on 8000
try {
    # Try an existing known route
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/v5/tarot/daily' -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Output "TAROT DAILY: $($r.StatusCode)"
} catch {
    Write-Output "TAROT DAILY ERROR: $($_.Exception.Message)"
}

try {
    # Try numerology (should be POST)
    $body = '{"year": 1990, "month": 1, "day": 1}'
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/v5/numerology/life-path' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 5
    Write-Output "NUMEROLOGY: $($r.StatusCode)"
} catch {
    Write-Output "NUMEROLOGY ERROR: $($_.Exception.Message)"
}

try {
    # Try an explicit OpenAPI path
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/v5/' -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Output "API V5 ROOT: $($r.StatusCode) $($r.Content.Substring(0, [Math]::Min(300, $r.Content.Length)))"
} catch {
    Write-Output "API V5 ROOT ERROR: $($_.Exception.Message)"
}

# Check all processes on port 8000
Write-Output "--- Processes on port 8000 ---"
