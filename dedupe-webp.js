const fs = require('fs');

// Read and parse CSV
function dedupeWebPImages() {
  console.log('🔄 Starting WebP Images Deduplication...');

  try {
    const content = fs.readFileSync('public/webp-images.csv', 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      console.log('❌ No data found in webp-images.csv');
      return;
    }

    const headers = lines[0].split(',');
    console.log(`📊 Processing ${lines.length} rows (including header)`);

    // Parse data rows
    const data = lines.slice(1).map((line, index) => {
      const parts = line.split(',');
      return {
        decor_id: parts[0],
        decor_name: parts[1],
        decor: parts[2],
        texture: parts[3],
        product_page_url: parts[4],
        image_url: parts[5],
        fileType: parts[6],
        rowNumber: index + 2 // +2 because +1 for 0-index, +1 to skip header
      };
    });

    console.log(`📋 Parsed ${data.length} data rows`);

    // Group by decor_id + base_image_id
    const groups = new Map();

    data.forEach(row => {
      // Extract base image identifier from PIM path
      const match = row.image_url.match(/\/pim\/([^\/]+\/[^\/]+)\//);
      if (!match) {
        console.log(`⚠️  No base image ID found for row ${row.rowNumber}: ${row.image_url}`);
        return;
      }

      const baseImageId = match[1];
      const key = `${row.decor_id}:${baseImageId}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(row);
    });

    console.log(`🔍 Found ${groups.size} unique decor_id + base_image combinations`);

    // Choose representative for each group
    const dedupedRows = [];

    for (const [key, rows] of groups.entries()) {
      const bestRow = chooseBestRepresentative(rows, key);
      if (bestRow) {
        dedupedRows.push(bestRow);
      }
    }

    console.log(`✅ Selected ${dedupedRows.length} representative rows`);

    // Create output
    const outputHeaders = 'decor_id,decor_name,decor,texture,product_page_url,image_url,FileType';
    const outputRows = dedupedRows.map(row =>
      `${row.decor_id},${row.decor_name},${row.decor},${row.texture},${row.product_page_url},${row.image_url},${row.fileType}`
    );

    const outputContent = [outputHeaders, ...outputRows].join('\n');

    // Backup original
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = `public/webp-images-backup-${timestamp}.csv`;

    console.log(`💾 Creating backup: ${backupFile}`);
    fs.writeFileSync(backupFile, content);

    // Write deduped file
    console.log(`💾 Writing deduped file: public/webp-images.csv`);
    fs.writeFileSync('public/webp-images.csv', outputContent);

    // Summary
    const originalSize = data.length;
    const dedupedSize = dedupedRows.length;
    const reduction = Math.round((1 - dedupedSize / originalSize) * 100);

    console.log('\n🎉 DEDUPLICATION COMPLETE!');
    console.log('='.repeat(50));
    console.log(`📊 Original rows: ${originalSize}`);
    console.log(`📊 Deduped rows: ${dedupedSize}`);
    console.log(`📊 Reduction: ${reduction}%`);
    console.log(`📊 Space saved: ${originalSize - dedupedSize} rows`);
    console.log('='.repeat(50));

    return {
      originalSize,
      dedupedSize,
      reduction,
      savedRows: originalSize - dedupedSize
    };

  } catch (error) {
    console.error('❌ Error during deduplication:', error.message);
    throw error;
  }
}

// Choose the best representative URL from a group
function chooseBestRepresentative(rows, key) {
  if (rows.length === 0) return null;

  // If only one row, return it
  if (rows.length === 1) return rows[0];

  // Sort by preference criteria
  const sorted = rows.sort((a, b) => {
    // Prefer 1024px width
    const aWidth = getWidthFromUrl(a.image_url);
    const bWidth = getWidthFromUrl(b.image_url);

    const aScore = calculateScore(a, aWidth);
    const bScore = calculateScore(b, bWidth);

    return bScore - aScore; // Higher score first
  });

  const chosen = sorted[0];
  const decorId = key.split(':')[0];

  console.log(`  🎯 ${decorId}: ${rows.length} → 1 (kept ${getWidthFromUrl(chosen.image_url)}px)`);

  return chosen;
}

// Calculate preference score for a URL
function calculateScore(row, width) {
  let score = 0;

  // Base score from width (prefer 1024px)
  if (width === 1024) score += 100;
  else if (width >= 768 && width <= 1536) score += 50;
  else if (width > 1536) score += 25; // Large images still valuable
  else score += 10; // Small images as fallback

  // Prefer AR_16_9 over AR_4_3
  if (row.image_url.includes('AR_16_9')) score += 20;
  else if (row.image_url.includes('AR_4_3')) score += 10;

  // Prefer webp format (should be all of them)
  if (row.fileType === 'webp') score += 5;

  return score;
}

// Extract width parameter from URL
function getWidthFromUrl(url) {
  const match = url.match(/width=(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// Main execution
if (require.main === module) {
  try {
    const result = dedupeWebPImages();
    console.log('\n✅ Process completed successfully!');
  } catch (error) {
    console.error('\n❌ Process failed:', error.message);
    process.exit(1);
  }
}

module.exports = { dedupeWebPImages };
