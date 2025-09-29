// Test the key matching logic between CSV and database
const csvData = [
  { colour_number: '9908', thumb_url: 'https://example.com/acid-drop-thumb.jpg' },
  { colour_number: '79', thumb_url: 'https://example.com/card-room-green-thumb.jpg' }
];

const dbData = [
  { color_number: '9908', color_name: 'Acid Drop' },
  { color_number: '79', color_name: 'Card Room Green' }
];

console.log('🔍 Testing key matching:');
console.log('CSV data keys:', csvData.map(item => item.colour_number));
console.log('DB data keys:', dbData.map(item => item.color_number));

// Test the matching logic
const csvMap = new Map();
csvData.forEach(item => {
  csvMap.set(item.colour_number, item);
});

console.log('\n📊 Matching test:');
dbData.forEach(dbItem => {
  const csvMatch = csvMap.get(dbItem.color_number);
  console.log(`DB ${dbItem.color_name} (${dbItem.color_number}) -> CSV match: ${csvMatch ? 'FOUND' : 'NOT FOUND'}`);
  if (csvMatch) {
    console.log(`  Thumbnail: ${csvMatch.thumb_url}`);
  }
});

// Test with actual data from our previous analysis
console.log('\n🔍 Testing with actual data:');
const actualCsvData = [
  { colour_number: '9908', thumb_url: 'acid-drop-thumb.jpg' },
  { colour_number: '79', thumb_url: 'card-room-green-thumb.jpg' }
];

const actualDbData = [
  { color_number: '9908', color_name: 'Acid Drop' },
  { color_number: '79', color_name: 'Card Room Green' }
];

const actualCsvMap = new Map();
actualCsvData.forEach(item => {
  actualCsvMap.set(item.colour_number, item);
});

console.log('Actual data matching:');
actualDbData.forEach(dbItem => {
  const csvMatch = actualCsvMap.get(dbItem.color_number);
  console.log(`DB ${dbItem.color_name} (${dbItem.color_number}) -> CSV match: ${csvMatch ? 'FOUND' : 'NOT FOUND'}`);
});

