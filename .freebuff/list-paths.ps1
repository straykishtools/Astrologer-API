# Check what routes the running server actually has
try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8050/openapi.json' -UseBasicParsing -TimeoutSec 5
    $json = $r.Content
    # Extract all paths
    $paths = [regex]::Matches($json, '"(/api/[^"]+)"') | ForEach-Object { $_.Groups[1].Value }
    Write-Output "All API paths:"
    foreach ($p in $paths) { Write-Output "  $p" }
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
