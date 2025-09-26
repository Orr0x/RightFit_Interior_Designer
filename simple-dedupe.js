const fs = require('fs');

// Simple deduplication of webp-images.csv
function dedupeSimple() {
  console.log('🔄 Simple WebP Deduplication...');

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
    const decor_id = parts[0];
    const image_url = parts[5];

    // Extract base image ID
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

  console.log(`🔍 Found ${groups.size} unique combinations`);

  // Select one representative per group
  const dedupedRows = [];

  for (const [key, rows] of groups.entries()) {
    if (rows.length === 0) continue;

    // Choose the first one (we'll improve this later)
    const chosenRow = rows[0];
    dedupedRows.push(chosenRow);

    const decor_id = key.split(':')[0];
    console.log(`  ✅ ${decor_id}: ${rows.length} → 1`);
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

  console.log('\n🎉 DEDUPLICATION COMPLETE!');
  console.log('='.repeat(40));
  console.log(`Original rows: ${originalSize}`);
  console.log(`Deduped rows: ${dedupedSize}`);
  console.log(`Reduction: ${reduction}%`);
  console.log(`Saved: ${originalSize - dedupedSize} rows`);
  console.log('='.repeat(40));
}

// Run the deduplication
try {
  dedupeSimple();
} catch (error) {
  console.error('❌ Error:', error.message);
}
