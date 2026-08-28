# Wait for server to be ready
Start-Sleep -Seconds 3

# Check biorhythm
try {
    $body = '{"birth_date": "1990-01-01", "target_date": "2026-08-27"}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/api/v5/biorhythm' -Method POST -Body $bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 5
    Write-Output "BIORHYTHM OK: $($r.StatusCode)"
    Write-Output $r.Content.Substring(0, [Math]::Min(400, $r.Content.Length))
} catch {
    Write-Output "BIORHYTHM ERROR: $($_.Exception.Message)"
}

# Check zodiac
try {
    $body = '{"year": 1990}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/api/v5/chinese-zodiac' -Method POST -Body $bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 5
    Write-Output "ZODIAC OK: $($r.StatusCode)"
    Write-Output $r.Content.Substring(0, [Math]::Min(400, $r.Content.Length))
} catch {
    Write-Output "ZODIAC ERROR: $($_.Exception.Message)"
}

# Check zodiac compatibility
try {
    $body = '{"animal1": "موش", "animal2": "اژدها"}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/api/v5/chinese-zodiac/compatibility' -Method POST -Body $bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 5
    Write-Output "COMPAT OK: $($r.StatusCode)"
    Write-Output $r.Content.Substring(0, [Math]::Min(400, $r.Content.Length))
} catch {
    Write-Output "COMPAT ERROR: $($_.Exception.Message)"
}

# Check biorhythm monthly
try {
    $body = '{"birth_date": "1990-01-01", "year": 2026, "month": 8}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/api/v5/biorhythm/monthly' -Method POST -Body $bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 5
    Write-Output "MONTHLY OK: $($r.StatusCode)"
    Write-Output $r.Content.Substring(0, [Math]::Min(400, $r.Content.Length))
} catch {
    Write-Output "MONTHLY ERROR: $($_.Exception.Message)"
}
