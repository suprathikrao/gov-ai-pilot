Set-Location $PSScriptRoot
$env:PYTHONPATH = $PSScriptRoot
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
        $name, $value = $_ -split '=', 2
        if ($name -and $value) {
            [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim())
        }
    }
}
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000
