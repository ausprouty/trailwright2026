<#
CompareFolders.ps1

Edit the two directory settings below.

Run from PowerShell:
  .\scripts\migration\compare-folders.ps1

Compares:
  - Relative folder paths, including empty folders
  - Relative file paths, ignoring the final file extension

Does not compare file contents or file types.
Names are compared without regard to capitalization.
No files or folders are changed.
#>

# ===== SETTINGS =====
$RawDirectory     = 'C:\ampp\htdocs\trailwright\data\raw'
$PreviewDirectory = 'C:\ampp\htdocs\trailwright\public\migration-preview'
# ====================

$ErrorActionPreference = 'Stop'

function Get-FolderInventory {
    param([string]$Directory)

    if (-not (Test-Path -LiteralPath $Directory -PathType Container)) {
        throw "Directory does not exist: $Directory"
    }

    $root = (Get-Item -LiteralPath $Directory).FullName.TrimEnd('\')
    $prefix = $root + '\'

    $inventory = @(
        foreach ($item in Get-ChildItem -LiteralPath $root -Recurse -Force) {
            $relativePath = $item.FullName.Substring($prefix.Length)

            if ($item.PSIsContainer) {
                "Folder: $relativePath"
            }
            if ($item.BaseName -eq 'index') { continue }
            else {
                $parent = [IO.Path]::GetDirectoryName($relativePath)
                $name = [IO.Path]::GetFileNameWithoutExtension($relativePath)

                $filePath = if ($parent) {
                    Join-Path $parent $name
                }
                else {
                    $name
                }

                "File:   $filePath"
            }
        }
    )

    # Multiple extensions with the same base name count as one entry.
    $inventory | Sort-Object -Unique
}

try {
    $raw = @(Get-FolderInventory -Directory $RawDirectory)
    $preview = @(Get-FolderInventory -Directory $PreviewDirectory)

    $rawSet = [Collections.Generic.HashSet[string]]::new(
        [StringComparer]::OrdinalIgnoreCase
    )
    $previewSet = [Collections.Generic.HashSet[string]]::new(
        [StringComparer]::OrdinalIgnoreCase
    )

    foreach ($entry in $raw) {
        [void]$rawSet.Add($entry)
    }
    foreach ($entry in $preview) {
        [void]$previewSet.Add($entry)
    }

    $onlyRaw = @($raw | Where-Object { -not $previewSet.Contains($_) })
    $onlyPreview = @($preview | Where-Object { -not $rawSet.Contains($_) })

    Write-Host "`nONLY IN RAW — missing from migration-preview:"
    if ($onlyRaw.Count) {
        $onlyRaw | ForEach-Object { Write-Host "  $_" }
    }
    else {
        Write-Host '  None'
    }

    Write-Host "`nONLY IN MIGRATION-PREVIEW — missing from raw:"
    if ($onlyPreview.Count) {
        $onlyPreview | ForEach-Object { Write-Host "  $_" }
    }
    else {
        Write-Host '  None'
    }

    Write-Host "`nRaw entries:     $($raw.Count)"
    Write-Host "Preview entries: $($preview.Count)"
    Write-Host "Only in raw:     $($onlyRaw.Count)"
    Write-Host "Only in preview: $($onlyPreview.Count)"

    if ($onlyRaw.Count -eq 0 -and $onlyPreview.Count -eq 0) {
        Write-Host "`nBoth directories match, ignoring file extensions."
    }
}
catch {
    Write-Error "Comparison stopped: $($_.Exception.Message)" -ErrorAction Continue
    exit 1
}