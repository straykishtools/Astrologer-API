try {
    $body = '{"year": 1990, "month": 5, "day": 15}'
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/v5/numerology/life-path' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 10
    Write-Output "STATUS: $($r.StatusCode)"
    $json = $r.Content | ConvertFrom-Json
    Write-Output "life_path: $($json.data.life_path)"
    Write-Output "meaning: $($json.data.meaning)"
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
