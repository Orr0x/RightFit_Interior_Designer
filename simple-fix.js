const fs = require('fs');

// Simple but effective deduplication
function fixDuplicates() {
  console.log('🔄 Simple WebP Fix...');

  const content = fs.readFileSync('public/webp-images.csv', 'utf8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length === 0) return;

  const headers = lines[0];
  const dataRows = lines.slice(1);

  console.log(`📊 Processing ${dataRows.length} rows`);

  // Track unique combinations
  const seen = new Set();
  const uniqueRows = [];

  dataRows.forEach((line, index) => {
    const parts = line.split(',');
    if (parts.length < 6) return;

    const decor_id = parts[0];
    const image_url = parts[5];

    // Extract base image identifier
    const match = image_url.match(/\/pim\/([^\/]+\/[^\/]+)\//);
    if (!match) return;

    const baseId = match[1];
    const key = `${decor_id}:${baseId}`;

    if (!seen.has(key)) {
      seen.add(key);
      uniqueRows.push(line);
      console.log(`  ✅ Added: ${decor_id} - ${baseId}`);
    }
  });

  console.log(`✅ Kept ${uniqueRows.length} unique combinations`);

  // Write result
  const output = [headers, ...uniqueRows].join('\n');
  fs.writeFileSync('public/webp-images.csv', output);

  console.log(`📊 Final count: ${uniqueRows.length} rows`);
  console.log('✅ Done!');
}

fixDuplicates();
