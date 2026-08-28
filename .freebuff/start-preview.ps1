$env:KERYKEION_EPHEMERIS_BACKEND = "libephemeris"
$env:PYTHONIOENCODING = "utf-8"
$env:ENV_TYPE = "dev"

$logFile = "C:\Users\Lucid\Documents\GitHub\Astrologer-API\.freebuff\preview-3de61416-5658-457a-87f3-d2789d70db19.log"
$logErr  = "C:\Users\Lucid\Documents\GitHub\Astrologer-API\.freebuff\preview-3de61416-5658-457a-87f3-d2789d70db19.log.err"

$proc = Start-Process -FilePath "C:\Users\Lucid\Documents\GitHub\Astrologer-API\venv\Scripts\python.exe" `
    -ArgumentList "C:\Users\Lucid\Documents\GitHub\Astrologer-API\.freebuff\server_wrapper.py" `
    -RedirectStandardOutput $logFile `
    -RedirectStandardError $logErr `
    -WorkingDirectory "C:\Users\Lucid\Documents\GitHub\Astrologer-API" `
    -WindowStyle Hidden `
    -PassThru

Write-Output $proc.Id
