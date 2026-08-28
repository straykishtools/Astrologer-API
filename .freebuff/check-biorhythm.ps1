# Check biorhythm endpoint
try {
    $body = '{"birth_date": "1990-01-01", "target_date": "2026-08-27"}'
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/v5/biorhythm' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 5
    Write-Output "BIORHYTHM: $($r.StatusCode) - $($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))"
} catch {
    Write-Output "BIORHYTHM ERROR: $($_.Exception.Message)"
}

# Check chinese zodiac endpoint
try {
    $body = '{"year": 1990}'
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/v5/chinese-zodiac' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 5
    Write-Output "ZODIAC: $($r.StatusCode) - $($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))"
} catch {
    Write-Output "ZODIAC ERROR: $($_.Exception.Message)"
}

# Check compatibility endpoint
try {
    $body = '{"animal1": "موش", "animal2": "اژدها"}'
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/v5/chinese-zodiac/compatibility' -Method POST -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 5
    Write-Output "COMPAT: $($r.StatusCode) - $($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))"
} catch {
    Write-Output "COMPAT ERROR: $($_.Exception.Message)"
}

# Check biorhythm monthly
try {
    $body = '{"birth_date": "1990-01-01", "year": 2026, "month": 8}'
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/v5/biorhythm/monthly' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 5
    Write-Output "MONTHLY: $($r.StatusCode) - $($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))"
} catch {
    Write-Output "MONTHLY ERROR: $($_.Exception.Message)"
}
