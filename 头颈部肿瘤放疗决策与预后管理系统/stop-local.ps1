$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $root ".local-server.pid"
$metaFile = Join-Path $root ".local-server.meta.json"

$pidValue = $null
$portValue = $null

if (Test-Path $metaFile) {
  try {
    $meta = Get-Content -Path $metaFile -Raw | ConvertFrom-Json
    $pidValue = $meta.pid
    $portValue = $meta.port
  } catch {
  }
}

if (-not $pidValue -and -not (Test-Path $pidFile)) {
  Write-Output "No PID file found."
  exit 0
}

if (-not $pidValue) {
  $pidValue = Get-Content $pidFile | Select-Object -First 1
}

if ($pidValue -match "^\d+$") {
  $process = Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
  if ($process) {
    Stop-Process -Id $process.Id -Force
    if ($portValue) {
      Write-Output "Stopped local site on port $portValue (PID $pidValue)."
    } else {
      Write-Output "Stopped PID $pidValue."
    }
  } else {
    Write-Output "Process $pidValue is not running."
  }
} else {
  Write-Output "Invalid PID file."
}

Remove-Item $pidFile -ErrorAction SilentlyContinue
Remove-Item $metaFile -ErrorAction SilentlyContinue
