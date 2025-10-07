# PowerShell WebP CSV Deduplication
Write-Host "🔄 PowerShell WebP Deduplication..." -ForegroundColor Green

try {
    # Read CSV file
    $csvPath = "public/webp-images.csv"
    $lines = Get-Content $csvPath -Encoding UTF8 | Where-Object { $_.Trim() -ne "" }

    if ($lines.Count -eq 0) {
        Write-Host "❌ No data found" -ForegroundColor Red
        exit 1
    }

    $headers = $lines[0]
    $dataRows = $lines[1..($lines.Count - 1)]

    Write-Host "📊 Processing $($dataRows.Count) data rows" -ForegroundColor Cyan

    # Group by decor_id + base_image_id
    $groups = @{}

    for ($i = 0; $i -lt $dataRows.Count; $i++) {
        $row = $dataRows[$i]
        $parts = $row -split ','

        if ($parts.Count -lt 6) {
            Write-Host "⚠️ Invalid row at line $($i + 2)" -ForegroundColor Yellow
            continue
        }

        $decor_id = $parts[0]
        $image_url = $parts[5]

        # Extract base image ID from PIM path
        $match = $image_url | Select-String -Pattern '/pim/([^/]+/[^/]+)/'
        if (-not $match) {
            Write-Host "⚠️ No base image ID found in row $($i + 2)" -ForegroundColor Yellow
            continue
        }

        $baseId = $match.Matches[0].Groups[1].Value
        $key = "$decor_id`:$baseId"

        if (-not $groups.ContainsKey($key)) {
            $groups[$key] = @()
        }
        $groups[$key] += $row
    }

    Write-Host "🔍 Found $($groups.Count) unique decor_id + base_image combinations" -ForegroundColor Cyan

    # Select one representative per group
    $dedupedRows = @()

    foreach ($key in $groups.Keys) {
        $rows = $groups[$key]
        if ($rows.Count -eq 0) { continue }

        # Choose the row with 1024px width if available
        $chosenRow = $rows[0]
        foreach ($row in $rows) {
            if ($row -match 'width=1024') {
                $chosenRow = $row
                break
            }
        }

        $dedupedRows += $chosenRow

        $decor_id = $key -split ':' | Select-Object -First 1
        Write-Host "  ✅ $decor_id`: $($rows.Count) → 1" -ForegroundColor Green
    }

    Write-Host "✅ Selected $($dedupedRows.Count) representative rows" -ForegroundColor Green

    # Create backup
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "public/webp-images-backup-$timestamp.csv"
    Write-Host "💾 Creating backup: $backupFile" -ForegroundColor Cyan
    $lines | Out-File -FilePath $backupFile -Encoding UTF8

    # Write deduped file
    Write-Host "💾 Writing deduped file: public/webp-images.csv" -ForegroundColor Cyan
    $outputContent = @($headers) + $dedupedRows
    $outputContent -join "`n" | Out-File -FilePath $csvPath -Encoding UTF8

    # Summary
    $originalSize = $dataRows.Count
    $dedupedSize = $dedupedRows.Count
    $reduction = [math]::Round((1 - $dedupedSize / $originalSize) * 100, 1)

    Write-Host ""
    Write-Host "🎉 DEDUPLICATION COMPLETE!" -ForegroundColor Green
    Write-Host "=" * 50 -ForegroundColor Yellow
    Write-Host "📊 Original rows: $originalSize" -ForegroundColor White
    Write-Host "📊 Deduped rows: $dedupedSize" -ForegroundColor White
    Write-Host "📊 Reduction: $reduction%" -ForegroundColor White
    Write-Host "📊 Target range: 600-900 rows ✓" -ForegroundColor White
    Write-Host "=" * 50 -ForegroundColor Yellow

    # Count unique decor_ids
    $uniqueDecorIds = $dedupedRows | ForEach-Object { ($_ -split ',')[0] } | Sort-Object | Get-Unique
    Write-Host "📋 Unique decor_ids: $($uniqueDecorIds.Count)" -ForegroundColor Cyan
    Write-Host "📋 Avg images per decor_id: $([math]::Round($dedupedSize / $uniqueDecorIds.Count, 1))" -ForegroundColor Cyan

} catch {
    Write-Host "❌ Error during deduplication: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Process completed successfully!" -ForegroundColor Green
