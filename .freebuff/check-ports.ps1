foreach ($port in 8000,8002,8003,8005,8010,8020,8080) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$port/api/v5/tarot/daily" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        Write-Output "Port ${port}: HTTP $($r.StatusCode)"
    } catch {
        Write-Output "Port ${port}: FAIL"
    }
}
