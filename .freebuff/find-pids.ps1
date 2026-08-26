Get-Process -Name python -ErrorAction SilentlyContinue |
  Where-Object { $_.StartTime -gt (Get-Date).AddMinutes(-5) } |
  Select-Object Id,ProcessName,StartTime,Path |
  Format-Table -AutoSize
