$stagedFiles = git diff --cached --name-only
scanner scan --pre-commit --staged-files $stagedFiles
exit $LASTEXITCODE
