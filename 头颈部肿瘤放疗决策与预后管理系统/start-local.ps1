$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $root ".local-server.pid"
$metaFile = Join-Path $root ".local-server.meta.json"
$stdoutLog = Join-Path $root ".local-server.out.log"
$stderrLog = Join-Path $root ".local-server.err.log"

function Test-PortInUse {
  param([int]$Port)

  $connection = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
  return $null -ne $connection
}

function Wait-ForPort {
  param(
    [int]$Port,
    [int]$TimeoutMs = 30000
  )

  $deadline = (Get-Date).AddMilliseconds($TimeoutMs)
  while ((Get-Date) -lt $deadline) {
    if (Test-PortInUse -Port $Port) {
      return $true
    }
    Start-Sleep -Milliseconds 500
  }

  return $false
}

if (Test-Path $metaFile) {
  try {
    $existingMeta = Get-Content -Path $metaFile -Raw | ConvertFrom-Json
    if ($existingMeta.pid -and (Get-Process -Id ([int]$existingMeta.pid) -ErrorAction SilentlyContinue)) {
      Write-Output "Local site already running: http://127.0.0.1:$($existingMeta.port)/"
      Write-Output "PID: $($existingMeta.pid)"
      exit 0
    }
  } catch {
  }
}

$preferredPorts = @()
if ($env:MED_PORT -match "^\d+$") {
  $preferredPorts += [int]$env:MED_PORT
}
$preferredPorts += 8080, 8081, 8082, 8090
$port = $preferredPorts |
  Select-Object -Unique |
  Where-Object { -not (Test-PortInUse -Port $_) } |
  Select-Object -First 1

if (-not $port) {
  Write-Output "No available port found in: $($preferredPorts -join ', ')"
  exit 1
}

$previousMedPort = $env:MED_PORT
$env:MED_PORT = [string]$port

try {
  $process = Start-Process `
    -FilePath "node" `
    -ArgumentList "server.js" `
    -WorkingDirectory $root `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru
} finally {
  if ($null -eq $previousMedPort) {
    Remove-Item Env:MED_PORT -ErrorAction SilentlyContinue
  } else {
    $env:MED_PORT = $previousMedPort
  }
}

if (-not (Wait-ForPort -Port $port -TimeoutMs 30000)) {
  if ($process -and -not $process.HasExited) {
    Stop-Process -Id $process.Id -Force
  }

  Write-Output "Local site failed to start on port $port."
  if (Test-Path $stderrLog) {
    $recentErrors = (Get-Content -Path $stderrLog -Tail 20) -join [Environment]::NewLine
    if ($recentErrors.Trim()) {
      Write-Output $recentErrors
    }
  }
  exit 1
}

$meta = @{
  pid = $process.Id
  port = $port
  host = "127.0.0.1"
  startedAt = (Get-Date).ToString("o")
} | ConvertTo-Json

Set-Content -Path $pidFile -Value $process.Id -Encoding ascii
Set-Content -Path $metaFile -Value $meta -Encoding utf8

Write-Output "Local site started: http://127.0.0.1:$port/"
Write-Output "PID: $($process.Id)"
