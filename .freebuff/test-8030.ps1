try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8030/api/v5/tarot/daily' -UseBasicParsing -TimeoutSec 5
    Write-Output "STATUS: $($r.StatusCode)"
    Write-Output $r.Content.Substring(0, [Math]::Min(500, $r.Content.Length))
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
