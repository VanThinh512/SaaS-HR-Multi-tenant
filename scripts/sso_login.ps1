# ============================================================
# sso_login.ps1
# Daily: Refresh AWS SSO short-lived credentials
# Usage: .\scripts\sso_login.ps1 [-Profile saashr]
# ============================================================

param(
    [string]$Profile = "saashr"
)

Write-Host ""
Write-Host "==> Refreshing AWS SSO credentials for profile: $Profile" -ForegroundColor Cyan

# Check AWS CLI
$awsCli = Get-Command aws -ErrorAction SilentlyContinue
if (-not $awsCli) {
    Write-Host "[ERROR] AWS CLI not found. Run scripts\setup_aws_sso.ps1 first." -ForegroundColor Red
    exit 1
}

# SSO Login
aws sso login --profile $Profile
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] SSO login failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==> Verifying identity..." -ForegroundColor Cyan
aws sts get-caller-identity --profile $Profile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Credentials refreshed. You are now authenticated as profile '$Profile'." -ForegroundColor Green
    Write-Host ""
    Write-Host "     Set as default for this PowerShell session:" -ForegroundColor Yellow
    Write-Host '     $env:AWS_PROFILE = "saashr"' -ForegroundColor Yellow
} else {
    Write-Host "[ERROR] Could not verify identity. Check SSO login." -ForegroundColor Red
    exit 1
}
