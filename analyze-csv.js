// Analyze CSV files for deduplication
const fs = require('fs');

// Read and parse CSV files
function analyzeCSV(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');

  console.log(`\n=== ${filename.toUpperCase()} ANALYSIS ===`);
  console.log(`Total rows (including header): ${lines.length}`);
  console.log(`Data rows: ${lines.length - 1}`);

  // Parse data rows
  const data = lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      decor_id: values[0],
      decor_name: values[1],
      decor: values[2],
      texture: values[3],
      product_page_url: values[4],
      image_url: values[5],
      fileType: values[6]
    };
  });

  // Get unique decor_ids
  const uniqueDecorIds = [...new Set(data.map(row => row.decor_id))];
  console.log(`Unique decor_ids: ${uniqueDecorIds.length}`);

  // Extract base image identifiers
  const baseImageMap = new Map();
  data.forEach(row => {
    const match = row.image_url.match(/\/pim\/([^\/]+\/[^\/]+)\//);
    if (match) {
      const baseId = match[1];
      const key = `${row.decor_id}:${baseId}`;
      if (!baseImageMap.has(key)) {
        baseImageMap.set(key, row);
      }
    }
  });

  console.log(`Unique decor_id + base_image combinations: ${baseImageMap.size}`);

  // Show some examples
  console.log('\n=== SAMPLE BASE IMAGE ANALYSIS ===');
  const samples = Array.from(baseImageMap.entries()).slice(0, 5);
  samples.forEach(([key, row]) => {
    const match = row.image_url.match(/\/pim\/([^\/]+\/[^\/]+)\//);
    const baseId = match ? match[1] : 'NO_MATCH';
    console.log(`${key} -> Base ID: ${baseId}`);
  });

  return {
    totalRows: lines.length,
    dataRows: data.length,
    uniqueDecorIds: uniqueDecorIds.length,
    uniqueCombinations: baseImageMap.size,
    headers: headers,
    data: data
  };
}

// Main analysis
console.log('CSV DEDUPLICATION ANALYSIS');
console.log('=' .repeat(50));

try {
  const webpResult = analyzeCSV('public/webp-images.csv');
  console.log('\n' + '='.repeat(50));

  const boardsResult = analyzeCSV('public/Boards.csv');

  console.log('\n=== SUMMARY ===');
  console.log(`WebP Images: ${webpResult.dataRows} rows → ${webpResult.uniqueCombinations} unique combinations (${Math.round(webpResult.uniqueCombinations/webpResult.dataRows*100)}% reduction)`);
  console.log(`Boards: ${boardsResult.dataRows} rows → ${boardsResult.uniqueDecorIds} unique decor_ids`);

} catch (error) {
  console.error('Error:', error.message);
}
