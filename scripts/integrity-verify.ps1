# scripts/integrity-verify.ps1
# Purpose: Timeout-aware verification of system integrity
# Observations: address observational latency in standard test runners

$timeoutSeconds = 30
Write-Host "[AEGIS] Starting Integrity Verification..." -ForegroundColor Yellow

$job = Start-Job -ScriptBlock {
    Set-Location "d:\Aegis Git Respository\aegis-core-shield"
    npm test -- --verbose
}

$result = Wait-Job $job -Timeout $timeoutSeconds

if ($null -eq $result) {
    Stop-Job $job
    Write-Error "[AEGIS] Verification Timed Out - Observational Latency Detected (Attention Fracture)"
    exit 1
}

$output = Receive-Job $job
$output

Write-Host "[AEGIS] Verification Complete." -ForegroundColor Green
