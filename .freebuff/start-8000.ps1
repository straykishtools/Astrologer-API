$env:KERYKEION_EPHEMERIS_BACKEND = "libephemris"
$env:PYTHONIOENCODING = "utf-8"
$env:ENV_TYPE = "dev"
Set-Location "C:\Users\Lucid\Documents\GitHub\Astrologer-API"
$proc = Start-Process -FilePath "C:\Users\Lucid\Documents\GitHub\Astrologer-API\venv\Scripts\python.exe" -ArgumentList "-m","uvicorn","app.main:app","--host","127.0.0.1","--port","8000","--reload" -NoNewWindow -PassThru
Write-Output $proc.Id
