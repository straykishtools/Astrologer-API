Set-Location "C:\Users\Lucid\Documents\GitHub\Astrologer-API"
$proc = Start-Process -FilePath "C:\Users\Lucid\Documents\GitHub\Astrologer-API\venv\Scripts\python.exe" -ArgumentList "-m","uvicorn","app.main:app","--host","127.0.0.1","--port","8050","--reload" -PassThru -WindowStyle Hidden -WorkingDirectory "C:\Users\Lucid\Documents\GitHub\Astrologer-API"
Write-Output "PID=$($proc.Id)"
