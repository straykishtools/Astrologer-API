Start-Sleep -Seconds 6

# Test biorhythm GET (to check if method matters)
try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/api/v5/biorhythm' -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Output "BIORHYTHM GET: $($r.StatusCode)"
} catch {
    Write-Output "BIORHYTHM GET: $($_.Exception.Message)"
}

# Test biorhythm POST with UTF8 encoding  
try {
    $body = '{"birth_date": "1990-01-01"}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/api/v5/biorhythm' -Method POST -Body $bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 5
    Write-Output "BIORHYTHM POST: $($r.StatusCode) $($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))"
} catch {
    Write-Output "BIORHYTHM POST: $($_.Exception.Message)"
}

# Test tarot POST
try {
    $body = '{"count": 1}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/api/v5/tarot/draw' -Method POST -Body $bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 5
    Write-Output "TAROT POST: $($r.StatusCode)"
} catch {
    Write-Output "TAROT POST: $($_.Exception.Message)"
}

# Check the full openapi spec for biorhythm  
try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/openapi.json' -UseBasicParsing -TimeoutSec 5
    $content = $r.Content
    if ($content -match 'biorhythm') { Write-Output "OpenAPI HAS biorhythm" } else { Write-Output "OpenAPI MISSING biorhythm" }
    if ($content -match 'chinese-zodiac') { Write-Output "OpenAPI HAS chinese-zodiac" } else { Write-Output "OpenAPI MISSING chinese-zodiac" }
} catch {
    Write-Output "OpenAPI ERROR: $($_.Exception.Message)"
}
