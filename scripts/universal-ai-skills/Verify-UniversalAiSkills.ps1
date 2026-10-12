<#
.SYNOPSIS
Verifies the reviewed universal AI skill pack offline.

.DESCRIPTION
Checks the manifest, skill frontmatter, source and installed file hashes, and
name collisions with other repository skill roots. It does not install files,
read credentials, or contact a network.

.PARAMETER RepositoryRoot
Repository root. Defaults to the parent of this script's scripts directory.

.PARAMETER SourceRoot
Reviewed local source root. Defaults to the manifest sourceRoot.

.PARAMETER TargetRoot
Repository-local install root. Defaults to the manifest defaultTargetRoot.

.PARAMETER Json
Emit a machine-readable summary.

.EXAMPLE
Verify-UniversalAiSkills.ps1 -Json
#>
[CmdletBinding()]
param(
    [string]$RepositoryRoot,
    [string]$SourceRoot,
    [string]$TargetRoot,
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

    $entries = @($manifest.skills)
    $expectedNames = @{}
    foreach ($entry in $entries) {
        $expectedNames[[string]$entry.name] = $true
    }

    $issues = @()
    $verified = @()
    $missing = @()

    $sourceExtras = @(Get-ChildItem -LiteralPath $sourcePath -Directory -Force | Where-Object {
            -not $expectedNames.ContainsKey($_.Name)
        })
    if ($sourceExtras.Count -gt 0) {
        $issues += "Unlisted source skill directories: $($sourceExtras.Name -join ', ')"
    }

    if (-not (Test-Path -LiteralPath $targetPath -PathType Container)) {
        $issues += "Installed target root is missing: $targetPath"
    }
    else {
        foreach ($entry in $entries) {
            $name = [string]$entry.name
            $sourceSkillPath = Join-Path -Path $sourcePath -ChildPath $name
            $targetSkillPath = Join-Path -Path $targetPath -ChildPath $name
            try {
                $sourceSkillFile = Assert-UaiSkillFile -SkillDirectory $sourceSkillPath -SkillName $name
                Assert-UaiReviewedSkillHash -SkillFile $sourceSkillFile -ExpectedHash ([string]$entry.sha256) -SkillName $name
                if (-not (Test-Path -LiteralPath $targetSkillPath -PathType Container)) {
                    $missing += $name
                    continue
                }
                Assert-UaiSkillFile -SkillDirectory $targetSkillPath -SkillName $name | Out-Null
                if (-not (Test-UaiTreeEqual -Left $sourceSkillPath -Right $targetSkillPath)) {
                    $issues += "${name} source and target contents differ"
                    continue
                }
                $verified += $name
            }
            catch {
                $issues += "${name}: $($_.Exception.Message)"
            }
        }
    }

    if ($missing.Count -gt 0) {
        $issues += "Missing installed skills: $($missing -join ', ')"
    }

    $unmanagedTarget = @()
    if (Test-Path -LiteralPath $targetPath -PathType Container) {
        $unmanagedTarget = @(Get-ChildItem -LiteralPath $targetPath -Directory -Force | Where-Object {
                -not $expectedNames.ContainsKey($_.Name)
            } | ForEach-Object { $_.Name })
    }

    $nameCollisions = @()
    foreach ($relativeRoot in @('.agents\skills', '.claude\skills')) {
        $compatRoot = Join-Path -Path $RepositoryRoot -ChildPath $relativeRoot
        if (-not (Test-Path -LiteralPath $compatRoot -PathType Container)) {
            continue
        }
        foreach ($directory in @(Get-ChildItem -LiteralPath $compatRoot -Directory -Force)) {
            if ($expectedNames.ContainsKey($directory.Name)) {
                $nameCollisions += "$relativeRoot\$($directory.Name)"
            }
        }
    }
    if ($nameCollisions.Count -gt 0) {
        $issues += "Managed skill names also exist in another repository skill root: $($nameCollisions -join ', ')"
    }

    $summary = [ordered]@{
        status = if ($issues.Count -eq 0) { 'ok' } else { 'failed' }
        pack = [string]$manifest.pack
        version = [string]$manifest.version
        repositoryRoot = $RepositoryRoot
        sourceRoot = $sourcePath
        targetRoot = $targetPath
        reviewedCount = $entries.Count
        verifiedCount = $verified.Count
        verified = @($verified)
        missing = @($missing)
        unmanagedTarget = @($unmanagedTarget)
        nameCollisions = @($nameCollisions)
        issues = @($issues)
    }

    if ($Json) {
        $summary | ConvertTo-Json -Depth 6
    }
    else {
        Write-Output "Universal AI skill verification: $($summary.status)"
        Write-Output "Verified $($verified.Count)/$($entries.Count) managed skills at $targetPath"
        if ($unmanagedTarget.Count -gt 0) {
            Write-Output "Unmanaged target directories preserved: $($unmanagedTarget -join ', ')"
        }
        foreach ($item in $issues) { Write-Output "ISSUE: $item" }
    }

    if ($issues.Count -gt 0) {
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
