try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/api/v5/numerology/life-path' -Method POST -Body '{"year":1990,"month":5,"day":15}' -ContentType 'application/json' -UseBasicParsing -TimeoutSec 10
    Write-Output "STATUS: $($r.StatusCode)"
    Write-Output $r.Content.Substring(0, [Math]::Min(300, $r.Content.Length))
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
