// Quick script to extract the complete components array from EnhancedSidebar
const fs = require('fs');

const content = fs.readFileSync('src/components/designer/EnhancedSidebar.tsx', 'utf8');

// Find the start of the components array
const startMarker = 'const components: ComponentDefinition[] = [';
const endMarker = '];';

const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
  console.error('Could not find components array start');
  process.exit(1);
}

// Find the matching closing bracket
let bracketCount = 0;
let endIndex = -1;
let inString = false;
let stringChar = '';
let escaped = false;

for (let i = startIndex + startMarker.length; i < content.length; i++) {
  const char = content[i];
  
  if (escaped) {
    escaped = false;
    continue;
  }
  
  if (char === '\\') {
    escaped = true;
    continue;
  }
  
  if (inString) {
    if (char === stringChar) {
      inString = false;
      stringChar = '';
    }
    continue;
  }
  
  if (char === '"' || char === "'" || char === '`') {
    inString = true;
    stringChar = char;
    continue;
  }
  
  if (char === '[') {
    bracketCount++;
  } else if (char === ']') {
    if (bracketCount === 0) {
      endIndex = i;
      break;
    }
    bracketCount--;
  }
}

if (endIndex === -1) {
  console.error('Could not find components array end');
  process.exit(1);
}

const componentsArray = content.substring(startIndex + startMarker.length, endIndex).trim();

console.log('Components array extracted successfully!');
console.log(`Length: ${componentsArray.length} characters`);

// Write to a temporary file
fs.writeFileSync('temp_components.txt', componentsArray);
console.log('Written to temp_components.txt');
