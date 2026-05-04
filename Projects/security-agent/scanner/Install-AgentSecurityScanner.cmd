@echo off
setlocal
title Agent Security Scanner Setup

set "SCRIPT_DIR=%~dp0"
set "SCANNER_EXE=%SCRIPT_DIR%dist\scanner.exe"
set "WORKSPACE=%SCRIPT_DIR%.."

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& { $ErrorActionPreference = 'Continue'; Write-Host ''; Write-Host 'Agent Security Scanner Setup' -ForegroundColor Cyan; Write-Host '============================'; Write-Host ''; $scanner = '%SCANNER_EXE%'; $workspace = (Resolve-Path '%WORKSPACE%').Path; Write-Host \"Scanner:  $scanner\"; Write-Host \"Workspace: $workspace\"; Write-Host ''; if (!(Test-Path $scanner)) { Write-Host 'scanner.exe was not found at scanner\dist\scanner.exe.' -ForegroundColor Red; Read-Host 'Press Enter to close'; exit 1 }; Write-Host 'Checking scanner version...' -ForegroundColor Yellow; & $scanner --version; Write-Host ''; Write-Host 'Running setup. This may install missing tools with winget or pip and install the Git pre-commit hook.' -ForegroundColor Yellow; & $scanner setup --workspace $workspace; $exitCode = $LASTEXITCODE; Write-Host ''; $hook = Join-Path $workspace '.git\hooks\pre-commit'; if (Test-Path $hook) { Write-Host \"Pre-commit hook found: $hook\" -ForegroundColor Green } else { Write-Host \"Pre-commit hook not found: $hook\" -ForegroundColor Yellow }; Write-Host ''; if ($exitCode -eq 0) { Write-Host 'Setup completed successfully.' -ForegroundColor Green } else { Write-Host \"Setup finished with exit code $exitCode. Review the messages above for missing tools or install failures.\" -ForegroundColor Red }; Write-Host ''; Read-Host 'Press Enter to close this window'; exit $exitCode }"

endlocal
