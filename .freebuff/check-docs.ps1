# Check if the docs page shows our new routes
try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/openapi.json' -UseBasicParsing -TimeoutSec 5
    $json = $r.Content
    if ($json -match "biorhythm") { Write-Output "BIORHYTHM route FOUND in OpenAPI" } else { Write-Output "BIORHYTHM route NOT FOUND" }
    if ($json -match "chinese-zodiac") { Write-Output "CHINESE-ZODIAC route FOUND in OpenAPI" } else { Write-Output "CHINESE-ZODIAC route NOT FOUND" }
    if ($json -match "numerology") { Write-Output "NUMEROLOGY route FOUND in OpenAPI" } else { Write-Output "NUMEROLOGY route NOT FOUND" }
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
