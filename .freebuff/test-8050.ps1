Start-Sleep -Seconds 5

# Check docs
try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/docs' -UseBasicParsing -TimeoutSec 5
    Write-Output "DOCS: $($r.StatusCode)"
} catch {
    Write-Output "DOCS ERROR: $($_.Exception.Message)"
}

# Check biorhythm
try {
    $body = '{"birth_date": "1990-01-01", "target_date": "2026-08-27"}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/api/v5/biorhythm' -Method POST -Body $bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 5
    Write-Output "BIORHYTHM: $($r.StatusCode) $($r.Content.Substring(0, [Math]::Min(300, $r.Content.Length)))"
} catch {
    Write-Output "BIORHYTHM ERROR: $($_.Exception.Message)"
}

# Check chinese zodiac
try {
    $body = '{"year": 1990}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/api/v5/chinese-zodiac' -Method POST -Body $bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 5
    Write-Output "ZODIAC: $($r.StatusCode) $($r.Content.Substring(0, [Math]::Min(300, $r.Content.Length)))"
} catch {
    Write-Output "ZODIAC ERROR: $($_.Exception.Message)"
}

# Check numerology
try {
    $body = '{"year": 1990, "month": 1, "day": 1}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/api/v5/numerology/life-path' -Method POST -Body $bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 5
    Write-Output "NUMEROLOGY: $($r.StatusCode) $($r.Content.Substring(0, [Math]::Min(300, $r.Content.Length)))"
} catch {
    Write-Output "NUMEROLOGY ERROR: $($_.Exception.Message)"
}
