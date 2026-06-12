# ============================================================
# setup_aws_sso.ps1
# One-time setup: Install AWS CLI v2 + configure SSO profile
# Run from PowerShell (Admin recommended for MSI install)
# Usage: .\scripts\setup_aws_sso.ps1
# ============================================================

param(
    [string]$SSOStartUrl = "https://d-9667aa1ea5.awsapps.com/start",   # SaaS-HR project SSO
    [string]$SSORegion   = "ap-southeast-1",
    [string]$AccountId   = "016461465939",                              # AWS Account ID
    [string]$ProfileName = "saashr",
    [string]$RoleName    = "AdminAccess"
)

$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "" ; Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "    [WARN] $msg" -ForegroundColor Yellow }

# ----------------------------------------------------------
# STEP 1: Check / Install AWS CLI v2
# ----------------------------------------------------------
Write-Step "Checking AWS CLI installation..."

$awsCli = Get-Command aws -ErrorAction SilentlyContinue
if ($awsCli) {
    $version = (aws --version 2>&1)
    Write-OK "AWS CLI already installed: $version"
} else {
    Write-Warn "AWS CLI not found. Downloading installer..."

    $installerUrl  = "https://awscli.amazonaws.com/AWSCLIV2.msi"
    $installerPath = "$env:TEMP\AWSCLIV2.msi"

    Write-Host "    Downloading from $installerUrl ..."
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing

    Write-Host "    Installing AWS CLI v2 (silent)..."
    Start-Process msiexec.exe -Wait -ArgumentList "/i `"$installerPath`" /quiet /norestart"

    # Refresh PATH in current session
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH","User")

    $awsCli = Get-Command aws -ErrorAction SilentlyContinue
    if ($awsCli) {
        Write-OK "AWS CLI installed: $(aws --version 2>&1)"
    } else {
        Write-Host "[ERROR] Installation failed. Install manually from:" -ForegroundColor Red
        Write-Host "https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html" -ForegroundColor Red
        exit 1
    }
}

# ----------------------------------------------------------
# STEP 2: Prompt for missing SSO parameters
# ----------------------------------------------------------
Write-Step "Collecting SSO configuration..."

if (-not $SSOStartUrl) {
    Write-Host "    Enter your IAM Identity Center SSO Start URL"
    Write-Host "    (Console -> IAM Identity Center -> Settings -> AWS access portal URL)"
    $SSOStartUrl = Read-Host "    SSO Start URL"
}

if (-not $AccountId) {
    Write-Host "    Enter your AWS Account ID (12 digits)"
    $AccountId = Read-Host "    Account ID"
}

Write-Host ""
Write-Host "    Profile Name : $ProfileName"
Write-Host "    SSO Start URL: $SSOStartUrl"
Write-Host "    SSO Region   : $SSORegion"
Write-Host "    Account ID   : $AccountId"
Write-Host "    Role Name    : $RoleName"

# ----------------------------------------------------------
# STEP 3: Write profile to ~/.aws/config
# ----------------------------------------------------------
Write-Step "Writing AWS SSO profile to ~/.aws/config ..."

$awsConfigDir  = "$env:USERPROFILE\.aws"
$awsConfigFile = "$awsConfigDir\config"

if (-not (Test-Path $awsConfigDir)) {
    New-Item -ItemType Directory -Path $awsConfigDir | Out-Null
}

$existingConfig = ""
if (Test-Path $awsConfigFile) {
    $existingConfig = Get-Content $awsConfigFile -Raw
}

$profileHeader = "[profile $ProfileName]"
if ($existingConfig -like "*$profileHeader*") {
    Write-Warn "Profile '$ProfileName' already exists in $awsConfigFile - skipping write."
    Write-Warn "To update, edit $awsConfigFile and remove the existing [$ProfileName] block."
} else {
    $lines = @(
        "",
        "[profile $ProfileName]",
        "sso_start_url  = $SSOStartUrl",
        "sso_region     = $SSORegion",
        "sso_account_id = $AccountId",
        "sso_role_name  = $RoleName",
        "region         = $SSORegion",
        "output         = json"
    )
    Add-Content -Path $awsConfigFile -Value ($lines -join "`n")
    Write-OK "Profile '$ProfileName' written to $awsConfigFile"
}

# ----------------------------------------------------------
# STEP 4: SSO Login
# ----------------------------------------------------------
Write-Step "SSO Login"
Write-Host "    Run this daily to refresh short-lived credentials:"
Write-Host "    aws sso login --profile $ProfileName" -ForegroundColor Yellow
Write-Host ""

$doLogin = Read-Host "    Login now? (y/n)"
if ($doLogin -eq "y" -or $doLogin -eq "Y") {
    aws sso login --profile $ProfileName
    if ($LASTEXITCODE -eq 0) {
        Write-OK "SSO login successful!"
        Write-Host ""
        Write-Host "    Verifying identity..." -ForegroundColor Cyan
        aws sts get-caller-identity --profile $ProfileName
    } else {
        Write-Warn "SSO login returned non-zero exit. Try again: aws sso login --profile $ProfileName"
    }
} else {
    Write-Host "    Skipped. Run when ready:" -ForegroundColor Yellow
    Write-Host "    aws sso login --profile $ProfileName" -ForegroundColor Yellow
}

# ----------------------------------------------------------
# STEP 5: Summary
# ----------------------------------------------------------
Write-Step "Setup complete!"
Write-Host ""
Write-Host "  Daily workflow:" -ForegroundColor Cyan
Write-Host "    aws sso login --profile $ProfileName" -ForegroundColor Yellow
Write-Host "    aws sts get-caller-identity --profile $ProfileName" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Set default profile for this session:" -ForegroundColor Cyan
Write-Host '    $env:AWS_PROFILE = "saashr"' -ForegroundColor Yellow
Write-Host ""
Write-Host "  Config file: $awsConfigFile" -ForegroundColor Cyan
