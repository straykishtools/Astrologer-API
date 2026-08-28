# Check all listening TCP ports
$connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -ge 8000 -and $_.LocalPort -le 8100 }
foreach ($c in $connections) {
    $procName = (Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue).ProcessName
    Write-Output "Port $($c.LocalPort) -> PID $($c.OwningProcess) ($procName)"
}
