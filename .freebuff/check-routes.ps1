try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/openapi.json' -UseBasicParsing -TimeoutSec 10
    $json = $r.Content | ConvertFrom-Json
    $paths = $json.paths.PSObject.Properties.Name
    $numPaths = $paths | Where-Object { $_ -like '*numerology*' }
    if ($numPaths) {
        Write-Output "Numerology routes found:"
        $numPaths | ForEach-Object { Write-Output "  $_" }
    } else {
        Write-Output "No numerology routes found!"
        Write-Output "All routes:"
        $paths | ForEach-Object { Write-Output "  $_" }
    }
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
