$conns = Get-NetTCPConnection -LocalPort 8050 -State Listen -ErrorAction SilentlyContinue
foreach ($c in $conns) {
    $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
    Write-Output "Port 8050: PID=$($c.OwningProcess) Process=$($proc.ProcessName) StartTime=$($proc.StartTime)"
}
