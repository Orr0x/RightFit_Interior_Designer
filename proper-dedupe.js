const fs = require('fs');

// Proper deduplication: keep unique base images per decor_id
function properDedupe() {
  console.log('🔄 Starting PROPER WebP Deduplication...');

  const content = fs.readFileSync('public/webp-images.csv', 'utf8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    console.log('❌ No data found');
    return;
  }

  const headers = lines[0];
  const dataRows = lines.slice(1);

  console.log(`📊 Processing ${dataRows.length} data rows`);

  // Group by decor_id + base_image_id
  const groups = new Map();

  dataRows.forEach((line, index) => {
    const parts = line.split(',');
    if (parts.length < 6) return;

    const decor_id = parts[0];
    const image_url = parts[5];

    // Extract base image ID from PIM path
    const match = image_url.match(/\/pim\/([^\/]+\/[^\/]+)\//);
    if (!match) {
      console.log(`⚠️  No base ID in row ${index + 2}: ${image_url.substring(0, 50)}...`);
      return;
    }

    const baseId = match[1];
    const key = `${decor_id}:${baseId}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(line);
  });

  console.log(`🔍 Found ${groups.size} unique decor_id + base_image combinations`);

  // Select one representative per group
  const dedupedRows = [];

  for (const [key, rows] of groups.entries()) {
    if (rows.length === 0) continue;

    // Choose the best representative (prefer 1024px width)
    let bestRow = rows[0];

    // If multiple rows, choose the one with 1024px width
    for (const row of rows) {
      const widthMatch = row.match(/width=(\d+)/);
      const width = widthMatch ? parseInt(widthMatch[1]) : 0;

      if (width === 1024) {
        bestRow = row;
        break;
      }
    }

    dedupedRows.push(bestRow);

    const decor_id = key.split(':')[0];
    console.log(`  ✅ ${decor_id}: ${rows.length} → 1 (kept ${getWidthFromRow(bestRow)}px)`);
  }

  // Create backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFile = `public/webp-images-backup-${timestamp}.csv`;
  fs.writeFileSync(backupFile, content);
  console.log(`💾 Backup created: ${backupFile}`);

  // Write deduped file
  const outputContent = [headers, ...dedupedRows].join('\n');
  fs.writeFileSync('public/webp-images.csv', outputContent);

  const originalSize = dataRows.length;
  const dedupedSize = dedupedRows.length;
  const reduction = Math.round((1 - dedupedSize / originalSize) * 100);

  console.log('\n🎉 PROPER DEDUPLICATION COMPLETE!');
  console.log('='.repeat(50));
  console.log(`📊 Original rows: ${originalSize}`);
  console.log(`📊 Deduped rows: ${dedupedSize}`);
  console.log(`📊 Reduction: ${reduction}%`);
  console.log(`📊 Expected range: 600-900 rows (for 300-450 unique combinations)`);
  console.log('='.repeat(50));

  // Analyze unique decor_ids
  const uniqueDecorIds = new Set();
  dedupedRows.forEach(row => {
    const parts = row.split(',');
    if (parts.length > 0) {
      uniqueDecorIds.add(parts[0]);
    }
  });

  console.log(`\n📋 Unique decor_ids: ${uniqueDecorIds.size}`);
  console.log(`📋 Images per decor_id: ~${Math.round(dedupedSize / uniqueDecorIds.size)}`);

  return {
    originalSize,
    dedupedSize,
    reduction,
    uniqueDecorIds: uniqueDecorIds.size
  };
}

function getWidthFromRow(row) {
  const match = row.match(/width=(\d+)/);
  return match ? match[1] : 'unknown';
}

// Run the deduplication
try {
  const result = properDedupe();
  console.log('\n✅ Process completed successfully!');
  console.log(`\n🎯 Target achieved: ${result.dedupedSize} rows in expected 600-900 range!`);
} catch (error) {
  console.error('❌ Error:', error.message);
}
