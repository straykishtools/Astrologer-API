$time = Get-Date
Set-ItemProperty -Path "C:\Users\Lucid\Documents\GitHub\Astrologer-API\app\main.py" -Name LastWriteTime -Value $time
Start-Sleep -Seconds 3
Write-Output "Touched main.py at $time"
