try {
    $p = Get-Process -Id 21576 -ErrorAction Stop
    Write-Output "Process alive: $($p.ProcessName) PID=$($p.Id) StartTime=$($p.StartTime)"
} catch {
    Write-Output "Process 21576 dead"
}

# Also check what processes are python on any port
Write-Output "---"
Get-Process python* -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,StartTime | Format-Table
