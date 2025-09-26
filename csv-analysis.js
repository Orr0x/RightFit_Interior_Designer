const fs = require('fs');

function analyzeFile(filename) {
  try {
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    console.log(`\n=== ${filename.toUpperCase()} ===`);
    console.log(`Total lines: ${lines.length}`);

    if (lines.length === 0) return;

    const headers = lines[0].split(',');
    console.log(`Headers: ${headers.join(', ')}`);

    // Parse data
    const data = lines.slice(1).map(line => {
      const parts = line.split(',');
      return {
        decor_id: parts[0],
        decor_name: parts[1],
        decor: parts[2],
        texture: parts[3],
        product_page_url: parts[4],
        image_url: parts[5],
        fileType: parts[6]
      };
    });

    console.log(`Data rows: ${data.length}`);

    // Analyze duplicates
    const uniqueDecorIds = new Set(data.map(row => row.decor_id));
    console.log(`Unique decor_ids: ${uniqueDecorIds.size}`);

    // Base image analysis
    const baseImageGroups = new Map();
    data.forEach(row => {
      const match = row.image_url.match(/\/pim\/([^\/]+\/[^\/]+)\//);
      const baseId = match ? match[1] : 'NO_BASE_ID';
      const key = `${row.decor_id}:${baseId}`;

      if (!baseImageGroups.has(key)) {
        baseImageGroups.set(key, []);
      }
      baseImageGroups.get(key).push(row);
    });

    console.log(`Unique decor_id+base_image combinations: ${baseImageGroups.size}`);

    // Show duplication examples
    console.log('\n=== DEDUPLICATION EXAMPLES ===');
    let count = 0;
    for (const [key, rows] of baseImageGroups.entries()) {
      if (rows.length > 1 && count < 3) {
        console.log(`${key}: ${rows.length} duplicates`);
        rows.slice(0, 2).forEach(row =>
          console.log(`  - ${row.image_url.substring(0, 80)}...`)
        );
        count++;
      }
    }

    return {
      totalLines: lines.length,
      dataRows: data.length,
      uniqueDecorIds: uniqueDecorIds.size,
      uniqueCombinations: baseImageGroups.size
    };

  } catch (error) {
    console.error(`Error analyzing ${filename}:`, error.message);
  }
}

// Main execution
console.log('CSV DEDUPLICATION ANALYSIS REPORT');
console.log('=' .repeat(60));

analyzeFile('public/webp-images.csv');
analyzeFile('public/Boards.csv');

console.log('\n=== RECOMMENDATION ===');
console.log('Based on the analysis, you can reduce duplicates by:');
console.log('1. Extract base image ID from PIM path');
console.log('2. Group by decor_id + base_image_id');
console.log('3. Keep one representative URL per group');
console.log('4. Choose optimal parameters (e.g., 1024px width)');
