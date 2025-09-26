# Simple WebP CSV Deduplication Script
Write-Host "🔄 Starting WebP Images Deduplication..." -ForegroundColor Green

try {
    # Read the CSV file
    $csvContent = Get-Content "public/webp-images.csv" -Encoding UTF8
    $lines = $csvContent | Where-Object { $_.Trim() -ne "" }

    if ($lines.Count -eq 0) {
        Write-Host "❌ No data found in webp-images.csv" -ForegroundColor Red
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
            Write-Host "⚠️ Invalid row at line $($i + 2): $row" -ForegroundColor Yellow
            continue
        }

        $decor_id = $parts[0]
        $image_url = $parts[5]

        # Extract base image ID from PIM path
        $match = $image_url | Select-String -Pattern '/pim/([^/]+/[^/]+)/'
        if (-not $match) {
            Write-Host "⚠️ No base image ID found in row $($i + 2): $image_url" -ForegroundColor Yellow
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

        # Choose the first row as representative
        $chosenRow = $rows[0]
        $dedupedRows += $chosenRow

        $decor_id = $key -split ':' | Select-Object -First 1
        Write-Host "  ✅ $decor_id`: $($rows.Count) → 1" -ForegroundColor Green
    }

    Write-Host "✅ Selected $($dedupedRows.Count) representative rows" -ForegroundColor Green

    # Create backup
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "public/webp-images-backup-$timestamp.csv"

    Write-Host "💾 Creating backup: $backupFile" -ForegroundColor Cyan
    $csvContent | Out-File -FilePath $backupFile -Encoding UTF8

    # Write deduped file
    Write-Host "💾 Writing deduped file: public/webp-images.csv" -ForegroundColor Cyan
    $outputContent = @($headers) + $dedupedRows
    $outputContent -join "`n" | Out-File -FilePath "public/webp-images.csv" -Encoding UTF8

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
    Write-Host "📊 Space saved: $($originalSize - $dedupedSize) rows" -ForegroundColor White
    Write-Host "=" * 50 -ForegroundColor Yellow

} catch {
    Write-Host "❌ Error during deduplication: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Process completed successfully!" -ForegroundColor Green
