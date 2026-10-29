$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
function Invoke-Check([string]$Folder, [string]$Program, [string[]]$Arguments) {
    Push-Location -LiteralPath (Join-Path $repo $Folder)
    try {
        & $Program @Arguments
        if ($LASTEXITCODE -ne 0) { throw "Check failed in $Folder" }
    } finally { Pop-Location }
}
Invoke-Check 'trendzy-api' 'mvn.cmd' @('-B', '-q', 'test', 'package')
Invoke-Check 'trendzy-business' 'mvn.cmd' @('-B', '-q', 'test', 'package')
Invoke-Check 'trendzy-front' 'npm.cmd' @('test')
Invoke-Check 'trendzy-front' 'npm.cmd' @('run', 'typecheck')
Invoke-Check 'trendzy-front' 'npm.cmd' @('run', 'build')
Write-Output 'TrendXee checks passed. Nothing was deployed.'
