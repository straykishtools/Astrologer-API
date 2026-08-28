$r = Invoke-WebRequest -Uri 'http://127.0.0.1:8030/api/v5/tarot/daily' -UseBasicParsing -TimeoutSec 5
$json = $r.Content | ConvertFrom-Json
Write-Output "card.name: $($json.data.card.name)"
Write-Output "card.image: $($json.data.card.image)"
Write-Output "is_reversed: $($json.data.is_reversed)"
