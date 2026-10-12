function Resolve-UaiFullPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    return [System.IO.Path]::GetFullPath($Path)
}

function Get-UaiTrimmedPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    return $Path.TrimEnd([char[]]"\/")
}

function Assert-UaiWithinRoot {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Root,
        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    $trimmedPath = Get-UaiTrimmedPath -Path $Path
    $trimmedRoot = Get-UaiTrimmedPath -Path $Root
    $prefix = $trimmedRoot + [System.IO.Path]::DirectorySeparatorChar
    $isRoot = $trimmedPath.Equals($trimmedRoot, [System.StringComparison]::OrdinalIgnoreCase)
    $isChild = $trimmedPath.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)

    if (-not ($isRoot -or $isChild)) {
        throw "$Label must stay inside the repository root: $Path"
    }
}

function Resolve-UaiScopedPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Candidate,
        [Parameter(Mandatory = $true)]
        [string]$RepositoryRoot,
        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    if ([System.IO.Path]::IsPathRooted($Candidate)) {
        $fullPath = Resolve-UaiFullPath -Path $Candidate
    }
    else {
        $fullPath = Resolve-UaiFullPath -Path (Join-Path -Path $RepositoryRoot -ChildPath $Candidate)
    }

    Assert-UaiWithinRoot -Path $fullPath -Root $RepositoryRoot -Label $Label
    return $fullPath
}

function Read-UaiManifest {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepositoryRoot
    )

    $manifestPath = Join-Path -Path $RepositoryRoot -ChildPath 'docs\universal-ai-skills\manifest.json'
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
        throw "The reviewed skill manifest is missing: $manifestPath"
    }

    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    if ($manifest.schemaVersion -ne 1) {
        throw "Unsupported universal skill manifest schema: $($manifest.schemaVersion)"
    }

    $entries = @($manifest.skills)
    if ($entries.Count -ne 24) {
        throw "Expected 24 reviewed skills, found $($entries.Count)"
    }

    $names = @{}
    foreach ($entry in $entries) {
        $name = [string]$entry.name
        if ($name -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$' -or $name.Length -gt 64) {
            throw "Invalid skill name in manifest: $name"
        }
        if ($names.ContainsKey($name)) {
            throw "Duplicate skill name in manifest: $name"
        }
        if (-not [bool]$entry.reviewed) {
            throw "Unreviewed skill is not installable: $name"
        }
        $sha256 = [string]$entry.sha256
        if ($sha256 -notmatch '^[0-9a-fA-F]{64}$') {
            throw "Reviewed skill $name must have a 64-character SHA-256 allowlist entry"
        }
        $names[$name] = $true
    }

    return $manifest
}

function Assert-UaiSkillFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SkillDirectory,
        [Parameter(Mandatory = $true)]
        [string]$SkillName
    )

    $skillFile = Join-Path -Path $SkillDirectory -ChildPath 'SKILL.md'
    if (-not (Test-Path -LiteralPath $skillFile -PathType Leaf)) {
        throw "Skill $SkillName is missing SKILL.md"
    }

    $unexpectedChildren = @(Get-ChildItem -LiteralPath $SkillDirectory -Force | Where-Object {
            $_.Name -ne 'SKILL.md'
        })
    if ($unexpectedChildren.Count -gt 0) {
        throw "Skill $SkillName contains unreviewed files or directories: $($unexpectedChildren.Name -join ', ')"
    }

    $content = Get-Content -LiteralPath $skillFile -Raw
    $frontmatterMatch = [System.Text.RegularExpressions.Regex]::Match(
        $content,
        '(?s)\A---\s*\r?\n.*?\r?\n---(?:\s*\r?\n|\s*$)'
    )
    if (-not $frontmatterMatch.Success) {
        throw "Skill $SkillName does not start with a YAML frontmatter block"
    }

    $frontmatter = $frontmatterMatch.Value
    $namePattern = "(?m)^name:\s*$([System.Text.RegularExpressions.Regex]::Escape($SkillName))\s*$"
    if ($frontmatter -notmatch $namePattern) {
        throw "Skill $SkillName frontmatter name does not match its directory"
    }

    $descriptionMatch = [System.Text.RegularExpressions.Regex]::Match(
        $frontmatter,
        '(?m)^description:\s*(.+?)\s*$'
    )
    if (-not $descriptionMatch.Success -or [string]::IsNullOrWhiteSpace($descriptionMatch.Groups[1].Value)) {
        throw "Skill $SkillName has no non-empty frontmatter description"
    }
    if ($descriptionMatch.Groups[1].Value.Trim().Length -gt 1024) {
        throw "Skill $SkillName description exceeds 1024 characters"
    }

    return $skillFile
}

function Assert-UaiReviewedSkillHash {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SkillFile,
        [Parameter(Mandatory = $true)]
        [string]$ExpectedHash,
        [Parameter(Mandatory = $true)]
        [string]$SkillName
    )

    $actualHash = (Get-FileHash -LiteralPath $SkillFile -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $ExpectedHash.ToLowerInvariant()) {
        throw "Skill $SkillName does not match its reviewed SHA-256 allowlist entry"
    }
}

function Get-UaiTreeHashes {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Root
    )

    $hashes = @{}
    $base = (Get-UaiTrimmedPath -Path $Root) + [System.IO.Path]::DirectorySeparatorChar
    $files = @(Get-ChildItem -LiteralPath $Root -File -Recurse -Force)
    foreach ($file in $files) {
        if (($file.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "Reparse-point files are not accepted in a local skill tree: $($file.FullName)"
        }
        $relativePath = $file.FullName.Substring($base.Length).Replace('\', '/')
        $hashes[$relativePath] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
    }

    return $hashes
}

function Test-UaiTreeEqual {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Left,
        [Parameter(Mandatory = $true)]
        [string]$Right
    )

    $leftHashes = Get-UaiTreeHashes -Root $Left
    $rightHashes = Get-UaiTreeHashes -Root $Right
    if ($leftHashes.Count -ne $rightHashes.Count) {
        return $false
    }

    foreach ($key in $leftHashes.Keys) {
        if (-not $rightHashes.ContainsKey($key) -or $leftHashes[$key] -ne $rightHashes[$key]) {
            return $false
        }
    }

    return $true
}

function Copy-UaiTree {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Source,
        [Parameter(Mandatory = $true)]
        [string]$Destination
    )

    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    $children = @(Get-ChildItem -LiteralPath $Source -Force)
    foreach ($child in $children) {
        if (($child.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "Reparse-point content is not accepted in a local skill tree: $($child.FullName)"
        }
        Copy-Item -LiteralPath $child.FullName -Destination $Destination -Recurse
    }
}
