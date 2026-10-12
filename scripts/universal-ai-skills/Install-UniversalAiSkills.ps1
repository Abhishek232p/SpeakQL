<#
.SYNOPSIS
Installs the reviewed local universal AI skill pack without network access.

.DESCRIPTION
Copies only manifest-listed skill directories from the repository source pack
to the repository-local OpenCode skills directory. Existing directories are
accepted only when their file hashes match; different content is a collision
and is never overwritten.

.PARAMETER RepositoryRoot
Repository root. Defaults to the parent of this script's scripts directory.

.PARAMETER SourceRoot
Reviewed local source root. Defaults to the manifest sourceRoot.

.PARAMETER TargetRoot
Repository-local install root. Defaults to the manifest defaultTargetRoot.

.PARAMETER DryRun
Plan and validate the operation without creating or copying files.

.PARAMETER Json
Emit a machine-readable summary.

.EXAMPLE
Install-UniversalAiSkills.ps1 -DryRun
#>
[CmdletBinding()]
param(
    [string]$RepositoryRoot,
    [string]$SourceRoot,
    [string]$TargetRoot,
    [switch]$DryRun,
    [switch]$Json
)

$ErrorActionPreference = 'Stop'
. (Join-Path -Path $PSScriptRoot -ChildPath 'SkillPack.Common.ps1')

try {
    if ([string]::IsNullOrWhiteSpace($RepositoryRoot)) {
        $RepositoryRoot = Resolve-UaiFullPath -Path (Join-Path -Path $PSScriptRoot -ChildPath '..\..')
    }
    else {
        $RepositoryRoot = Resolve-UaiFullPath -Path $RepositoryRoot
    }

    if (-not (Test-Path -LiteralPath $RepositoryRoot -PathType Container)) {
        throw "Repository root does not exist: $RepositoryRoot"
    }

    $manifest = Read-UaiManifest -RepositoryRoot $RepositoryRoot
    if ([string]::IsNullOrWhiteSpace($SourceRoot)) {
        $SourceRoot = [string]$manifest.sourceRoot
    }
    if ([string]::IsNullOrWhiteSpace($TargetRoot)) {
        $TargetRoot = [string]$manifest.defaultTargetRoot
    }

    $sourcePath = Resolve-UaiScopedPath -Candidate $SourceRoot -RepositoryRoot $RepositoryRoot -Label 'SourceRoot'
    $targetPath = Resolve-UaiScopedPath -Candidate $TargetRoot -RepositoryRoot $RepositoryRoot -Label 'TargetRoot'
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Container)) {
        throw "Skill source root does not exist: $sourcePath"
    }
    if ((Test-Path -LiteralPath $targetPath) -and -not (Test-Path -LiteralPath $targetPath -PathType Container)) {
        throw "Target root exists but is not a directory: $targetPath"
    }

    $entries = @($manifest.skills)
    $expectedNames = @{}
    foreach ($entry in $entries) {
        $expectedNames[[string]$entry.name] = $true
        $sourceSkillPath = Join-Path -Path $sourcePath -ChildPath ([string]$entry.name)
        if (-not (Test-Path -LiteralPath $sourceSkillPath -PathType Container)) {
            throw "Manifest skill source is missing: $sourceSkillPath"
        }
        $sourceSkillFile = Assert-UaiSkillFile -SkillDirectory $sourceSkillPath -SkillName ([string]$entry.name)
        Assert-UaiReviewedSkillHash -SkillFile $sourceSkillFile -ExpectedHash ([string]$entry.sha256) -SkillName ([string]$entry.name)
    }

    $sourceExtras = @(Get-ChildItem -LiteralPath $sourcePath -Directory -Force | Where-Object {
            -not $expectedNames.ContainsKey($_.Name)
        })
    if ($sourceExtras.Count -gt 0) {
        throw "Unlisted source skill directories are not installable: $($sourceExtras.Name -join ', ')"
    }

    $installed = @()
    $unchanged = @()
    $planned = @()
    $collisions = @()

    foreach ($entry in $entries) {
        $name = [string]$entry.name
        $sourceSkillPath = Join-Path -Path $sourcePath -ChildPath $name
        $targetSkillPath = Join-Path -Path $targetPath -ChildPath $name

        if (Test-Path -LiteralPath $targetSkillPath) {
            if (-not (Test-Path -LiteralPath $targetSkillPath -PathType Container)) {
                $collisions += "$name (target path is a file)"
                continue
            }

            if (Test-UaiTreeEqual -Left $sourceSkillPath -Right $targetSkillPath) {
                $unchanged += $name
            }
            else {
                $collisions += "$name (target exists with different content)"
            }
            continue
        }

        if ($DryRun) {
            $planned += $name
            continue
        }

        Copy-UaiTree -Source $sourceSkillPath -Destination $targetSkillPath
        $installed += $name
    }

    $summary = [ordered]@{
        status = if ($collisions.Count -eq 0) { 'ok' } else { 'collision' }
        pack = [string]$manifest.pack
        version = [string]$manifest.version
        repositoryRoot = $RepositoryRoot
        sourceRoot = $sourcePath
        targetRoot = $targetPath
        dryRun = [bool]$DryRun
        installed = @($installed)
        unchanged = @($unchanged)
        planned = @($planned)
        collisions = @($collisions)
    }

    if ($Json) {
        $summary | ConvertTo-Json -Depth 6
    }
    else {
        Write-Output "Universal AI skill pack $($summary.status): $($manifest.pack) $($manifest.version)"
        Write-Output "Target: $targetPath"
        Write-Output "Installed: $($installed.Count); unchanged: $($unchanged.Count); planned: $($planned.Count); collisions: $($collisions.Count)"
        foreach ($item in $planned) { Write-Output "DRY-RUN would install: $item" }
        foreach ($item in $installed) { Write-Output "Installed local skill: $item" }
        foreach ($item in $unchanged) { Write-Output "Already identical: $item" }
        foreach ($item in $collisions) { Write-Output "COLLISION left untouched: $item" }
    }

    if ($collisions.Count -gt 0) {
        exit 2
    }
    exit 0
}
catch {
    if ($Json) {
        [ordered]@{
            status = 'error'
            message = $_.Exception.Message
        } | ConvertTo-Json -Depth 4
    }
    else {
        Write-Error $_.Exception.Message
    }
    exit 1
}
