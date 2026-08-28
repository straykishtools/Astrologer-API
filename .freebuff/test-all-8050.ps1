Start-Sleep -Seconds 6

$endpoints = @(
    @{Url='http://127.0.0.1:8050/api/v5/biorhythm'; Method='POST'; Body='{"birth_date": "1990-01-01", "target_date": "2026-08-27"}'; Name='BIORHYTHM'},
    @{Url='http://127.0.0.1:8050/api/v5/biorhythm/monthly'; Method='POST'; Body='{"birth_date": "1990-01-01", "year": 2026, "month": 8}'; Name='BIORHYTHM-MONTHLY'},
    @{Url='http://127.0.0.1:8050/api/v5/chinese-zodiac'; Method='POST'; Body='{"year": 1990}'; Name='ZODIAC'},
    @{Url='http://127.0.0.1:8050/api/v5/chinese-zodiac/compatibility'; Method='POST'; Body='{"animal1": "موش", "animal2": "اژدها"}'; Name='COMPAT'},
    @{Url='http://127.0.0.1:8050/api/v5/tarot/daily'; Method='GET'; Body=''; Name='TAROT'},
    @{Url='http://127.0.0.1:8050/api/v5/numerology/life-path'; Method='POST'; Body='{"year": 1990, "month": 1, "day": 1}'; Name='NUMEROLOGY'},
    @{Url='http://127.0.0.1:8050/index.html'; Method='GET'; Body=''; Name='INDEX'}
)

foreach ($ep in $endpoints) {
    try {
        if ($ep.Body) {
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($ep.Body)
            $r = Invoke-WebRequest -Uri $ep.Url -Method $ep.Method -Body $bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 5
        } else {
            $r = Invoke-WebRequest -Uri $ep.Url -Method $ep.Method -UseBasicParsing -TimeoutSec 5
        }
        Write-Output "$($ep.Name): $($r.StatusCode)"
    } catch {
        Write-Output "$($ep.Name): ERROR $($_.Exception.Message)"
    }
}
