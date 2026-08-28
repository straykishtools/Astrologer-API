# Test numerology with GET (should fail if only POST is defined)
try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/v5/numerology/life-path' -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Output "NUMEROLOGY GET: $($r.StatusCode)"
} catch {
    Write-Output "NUMEROLOGY GET: $($_.Exception.Message)"
}

# Test tarot/draw with POST (should work)
try {
    $body = '{"count": 2}'
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/v5/tarot/draw' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 5
    Write-Output "TAROT DRAW POST: $($r.StatusCode)"
} catch {
    Write-Output "TAROT DRAW POST: $($_.Exception.Message)"
}

# Test biorhythm with GET (should fail)
try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/v5/biorhythm' -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Output "BIORHYTHM GET: $($r.StatusCode)"
} catch {
    Write-Output "BIORHYTHM GET: $($_.Exception.Message)"
}
