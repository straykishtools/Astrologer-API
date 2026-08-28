Start-Sleep -Seconds 5
try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/status' -UseBasicParsing -TimeoutSec 10
    Write-Output "STATUS: $($r.StatusCode)"
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
