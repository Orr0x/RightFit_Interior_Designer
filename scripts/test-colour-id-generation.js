// Test the colour_id generation logic
const testFinishes = [
  { color_name: 'Acid Drop', color_number: '9908' },
  { color_name: 'Card Room Green', color_number: '79' },
  { color_name: "Charlotte's Locks", color_number: '268' }
];

console.log('🔍 Testing colour_id generation:');
testFinishes.forEach(finish => {
  const colour_id = `${finish.color_name.toLowerCase().replace(/\s+/g, '-')}-${finish.color_number}`;
  const url = `/finishes/${colour_id}`;
  console.log(`- ${finish.color_name} (${finish.color_number})`);
  console.log(`  colour_id: ${colour_id}`);
  console.log(`  URL: ${url}`);
  console.log('');
});

// Test what the actual CSV data generates
console.log('📄 Testing CSV data generation:');
const csvSample = 'Acid Drop,9908,https://www.farrow-ball.com/paint/acid-drop,thumb_url,hover_url,description';
const csvData = csvSample.split(',');
const name = csvData[0];
const number = csvData[1];

const csvColourId = `${name.toLowerCase().replace(/\s+/g, '-')}-${number}`;
const csvUrl = `/finishes/${csvColourId}`;

console.log(`CSV Sample: ${name} (${number})`);
console.log(`CSV colour_id: ${csvColourId}`);
console.log(`CSV URL: ${csvUrl}`);
