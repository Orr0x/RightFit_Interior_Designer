// Test the actual CSV parser from the codebase
const csvText = 'Acid Drop,9908,https://www.farrow-ball.com/paint/acid-drop,thumb_url,hover_url,description';

const parseColoursCSV = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  const finishes = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(',');
    
    if (values.length >= 6) {
      const name = values[0];
      const number = values[1];
      const productUrl = values[2];
      const thumbUrl = values[3];
      const hoverUrl = values[4];
      const description = values.slice(5).join(',').replace(/"/g, '');
      
      const colour_id = `${name.toLowerCase().replace(/\s+/g, '-')}-${number}`;
      
      finishes.push({
        colour_id,
        colour_name: name,
        colour_number: number,
        product_url: productUrl,
        thumb_url: thumbUrl,
        hover_url: hoverUrl,
        description
      });
    }
  }
  
  return { finishes };
};

const result = parseColoursCSV(csvText);
console.log('CSV Parser Result:');
console.log(JSON.stringify(result, null, 2));

