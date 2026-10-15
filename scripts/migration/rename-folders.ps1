<#
rename-folders.ps1

EDIT THE SETTINGS BELOW:
  DirectoryToScan = directory to scan recursively
  FolderName      = exact folder name to find
  NewFolderName   = replacement folder name

RUN FROM POWERSHELL (replace the script path as needed):

Preview — shows proposed changes without renaming:
  & "C:\scripts\migration\rename-folders.ps1"

Run — performs the renames:
  & scripts\migration\rename-folders.ps1 -Apply

Preview is the default. Existing destinations are skipped.
Nested folders are processed deepest first.
#>

param([switch]$Apply)

# ===== SETTINGS: change these three values =====
#$DirectoryToScan = 'C:\ampp\htdocs\trailwright\data\raw\myfriends'
$DirectoryToScan = 'C:\ampp\htdocs\trailwright\data\processed_json\myfriends'
#$DirectoryToScan = 'C:\ampp\htdocs\trailwright\public\migration-preview\myfriends'
#$DirectoryToScan = 'C:\ampp\htdocs\trailwright\public\migration-raw\myfriends'
$FolderName      = 'multiply'
$NewFolderName   = 'multiply1'
# ==============================================

$ErrorActionPreference = 'Stop'

try {
    if (-not (Test-Path -LiteralPath $DirectoryToScan -PathType Container)) {
        throw "Directory does not exist: $DirectoryToScan"
    }

    foreach ($name in @($FolderName, $NewFolderName)) {
        if ([string]::IsNullOrWhiteSpace($name) -or
            $name -in @('.', '..') -or
            $name.IndexOfAny([IO.Path]::GetInvalidFileNameChars()) -ge 0 -or
            $name.EndsWith('.') -or $name.EndsWith(' ')) {
            throw "Invalid folder name: '$name'"
        }
    }

    if ($FolderName -eq $NewFolderName) {
        throw 'The original and new folder names must be different.'
    }

    $mode = if ($Apply) { 'RUN' } else { 'PREVIEW' }
    Write-Host "$mode — scanning $DirectoryToScan"

    # Collect matches first, then process children before parents.
    $folders = @(Get-ChildItem -LiteralPath $DirectoryToScan `
            -Directory -Recurse -Force |
        Where-Object { $_.Name -eq $FolderName } |
        Sort-Object { $_.FullName.Length } -Descending)

    foreach ($folder in $folders) {
        $destination = Join-Path $folder.Parent.FullName $NewFolderName

        if (Test-Path -LiteralPath $destination) {
            Write-Warning "SKIP: '$($folder.FullName)' — '$destination' already exists."
            continue
        }

        Rename-Item -LiteralPath $folder.FullName `
            -NewName $NewFolderName -WhatIf:(!$Apply)
    }

    Write-Host "`nFinished. Found $($folders.Count) matching folders."
}
catch {
    Write-Error "Stopped: $($_.Exception.Message)" -ErrorAction Continue
    exit 1
}