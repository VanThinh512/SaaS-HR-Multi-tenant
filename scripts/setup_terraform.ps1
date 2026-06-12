# ============================================================
# setup_terraform.ps1
# One-time: Cai dat Terraform + kiem tra ket noi S3 backend
# Usage: .\scripts\setup_terraform.ps1
# ============================================================

$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host ""; Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "    [WARN] $msg" -ForegroundColor Yellow }

# ----------------------------------------------------------
# STEP 1: Kiem tra / Cai Terraform
# ----------------------------------------------------------
Write-Step "Checking Terraform installation..."

$tf = Get-Command terraform -ErrorAction SilentlyContinue
if ($tf) {
    $ver = (terraform --version 2>&1 | Select-Object -First 1)
    Write-OK "Terraform already installed: $ver"
} else {
    Write-Warn "Terraform not found. Installing via winget..."

    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) {
        Write-Host "[ERROR] winget not found. Install manually from:" -ForegroundColor Red
        Write-Host "https://developer.hashicorp.com/terraform/install#windows" -ForegroundColor Red
        exit 1
    }

    winget install --id Hashicorp.Terraform --accept-source-agreements --accept-package-agreements --silent

    # Refresh PATH
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH","User")

    $tf = Get-Command terraform -ErrorAction SilentlyContinue
    if ($tf) {
        Write-OK "Terraform installed: $(terraform --version 2>&1 | Select-Object -First 1)"
    } else {
        Write-Host "[ERROR] Terraform install failed. Install manually:" -ForegroundColor Red
        Write-Host "https://developer.hashicorp.com/terraform/install#windows" -ForegroundColor Red
        exit 1
    }
}

# Kiem tra version >= 1.10
$verLine = (terraform --version 2>&1 | Select-Object -First 1)
if ($verLine -match "Terraform v(\d+)\.(\d+)") {
    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]
    if ($major -lt 1 -or ($major -eq 1 -and $minor -lt 10)) {
        Write-Warn "Version $major.$minor is below required >= 1.10. Please upgrade."
        Write-Host "    winget upgrade --id Hashicorp.Terraform" -ForegroundColor Yellow
    } else {
        Write-OK "Version OK (>= 1.10 required for native S3 locking)"
    }
}

# ----------------------------------------------------------
# STEP 2: kiem tra AWS CLI + SSO da setup chua
# ----------------------------------------------------------
Write-Step "Checking AWS CLI + SSO profile..."

$aws = Get-Command aws -ErrorAction SilentlyContinue
if (-not $aws) {
    Write-Host "[ERROR] AWS CLI not found. Run setup_aws_sso.ps1 first!" -ForegroundColor Red
    exit 1
}

$identity = aws sts get-caller-identity --profile saashr 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Not authenticated. Run first:" -ForegroundColor Red
    Write-Host "    .\scripts\setup_aws_sso.ps1  (first time)" -ForegroundColor Yellow
    Write-Host "    aws sso login --profile saashr  (daily)" -ForegroundColor Yellow
    exit 1
}
Write-OK "AWS authenticated: $identity"

# ----------------------------------------------------------
# STEP 3: terraform init infra/
# ----------------------------------------------------------
Write-Step "Running terraform init in infra/ ..."

$infraPath = Join-Path $PSScriptRoot "..\infra"
if (-not (Test-Path $infraPath)) {
    Write-Host "[ERROR] Cannot find infra/ directory at: $infraPath" -ForegroundColor Red
    exit 1
}

Push-Location $infraPath
terraform init
if ($LASTEXITCODE -eq 0) {
    Write-OK "Terraform backend connected to S3 (saashr-tfstate-016461465939)"
} else {
    Write-Host "[ERROR] terraform init failed." -ForegroundColor Red
    Pop-Location
    exit 1
}

# ----------------------------------------------------------
# STEP 4: terraform validate
# ----------------------------------------------------------
Write-Step "Validating configuration..."
terraform validate
if ($LASTEXITCODE -eq 0) {
    Write-OK "Configuration is valid!"
} else {
    Write-Warn "Validation failed. Check the errors above."
}

Pop-Location

# ----------------------------------------------------------
# Summary
# ----------------------------------------------------------
Write-Step "Setup complete!"
Write-Host ""
Write-Host "  Dev B is ready to use Terraform!" -ForegroundColor Green
Write-Host ""
Write-Host "  Daily workflow:" -ForegroundColor Cyan
Write-Host "    aws sso login --profile saashr   # refresh credentials each morning" -ForegroundColor Yellow
Write-Host "    cd infra" -ForegroundColor Yellow
Write-Host "    terraform plan                   # always plan before apply" -ForegroundColor Yellow
Write-Host "    terraform apply                  # coordinate with Dev A first!" -ForegroundColor Yellow
Write-Host ""
Write-Host "  RULE: Always announce before terraform apply - S3 lock prevents" -ForegroundColor Cyan
Write-Host "  concurrent applies but communication avoids confusion." -ForegroundColor Cyan
