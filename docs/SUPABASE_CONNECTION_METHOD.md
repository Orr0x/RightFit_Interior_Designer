# Supabase Connection Method - Standard Operating Procedure

**Date Created:** 2025-10-12
**Last Updated:** 2025-10-12
**Status:** ✅ VERIFIED WORKING

---

## ✅ Successful Method: Node.js + HTTPS REST API

### Overview

The most reliable method for querying Supabase from scripts is using **Node.js with the built-in HTTPS module** to directly access the Supabase REST API.

### Why This Method Works

1. ✅ No Docker required (unlike `supabase db dump`)
2. ✅ No additional dependencies (uses Node.js built-ins)
3. ✅ Works with `.cjs` files (CommonJS)
4. ✅ Direct REST API access (bypasses CLI issues)
5. ✅ Simple authentication via API key
6. ✅ Returns JSON data ready to use

---

## Connection Details

### Environment Variables

**File:** `.env`

```env
VITE_SUPABASE_URL=https://akfdezesupzuvukqiggn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZmRlemVzdXB6dXZ1a3FpZ2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDEyNzQsImV4cCI6MjA3Mjc3NzI3NH0.LVMu91CxxbrLHi2kcE7hreVDYi5OYuHI0Z4O1gigAMI
```

### REST API Endpoint Format

```
https://{project-ref}.supabase.co/rest/v1/{table-name}
```

**Our Project:**
```
https://akfdezesupzuvukqiggn.supabase.co/rest/v1/components
```

---

## Standard Script Template

### File Naming Convention

**IMPORTANT:** Use `.cjs` extension for CommonJS scripts.

```bash
scripts/query-something.cjs  # ✅ Correct
scripts/query-something.js   # ❌ Will fail (ES module mode in package.json)
```

### Template Code

**File:** `scripts/query-supabase-template.cjs`

```javascript
/**
 * Supabase Query Template
 * Run with: node scripts/query-supabase-template.cjs
 */

const https = require('https');
const fs = require('fs');

// Supabase credentials from .env
const SUPABASE_HOST = 'akfdezesupzuvukqiggn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZmRlemVzdXB6dXZ1a3FpZ2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDEyNzQsImV4cCI6MjA3Mjc3NzI3NH0.LVMu91CxxbrLHi2kcE7hreVDYi5OYuHI0Z4O1gigAMI';

/**
 * Query a Supabase table via REST API
 * @param {string} table - Table name (e.g., 'components')
 * @param {string} params - Query parameters (e.g., 'select=*&limit=10')
 * @returns {Promise<Array>} Array of rows
 */
async function queryTable(table, params = 'select=*') {
  const options = {
    hostname: SUPABASE_HOST,
    port: 443,
    path: `/rest/v1/${table}?${params}`,
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Main function - customize this for your needs
 */
async function main() {
  try {
    console.log('🔍 Querying Supabase...\n');

    // Example: Get all components
    const components = await queryTable('components', 'select=*&limit=5');
    console.log(`Found ${components.length} components:`);
    console.log(JSON.stringify(components, null, 2));

    // Example: Get specific columns
    const names = await queryTable('components', 'select=component_id,name,type');
    console.log(`\nComponent names: ${names.length}`);

    // Example: Filter by type
    const cabinets = await queryTable('components', 'select=*&type=eq.cabinet&limit=3');
    console.log(`\nCabinets: ${cabinets.length}`);

    console.log('\n✅ Query completed successfully');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
```

---

## Query Parameter Syntax

### Basic Select

```javascript
// All columns
await queryTable('components', 'select=*');

// Specific columns
await queryTable('components', 'select=id,name,type');

// Limit results
await queryTable('components', 'select=*&limit=10');
```

### Filtering

```javascript
// Exact match
await queryTable('components', 'select=*&type=eq.cabinet');

// Multiple filters
await queryTable('components', 'select=*&type=eq.cabinet&width=gte.60');

// IN operator
await queryTable('components', 'select=*&type=in.(cabinet,sink)');

// LIKE operator (pattern matching)
await queryTable('components', 'select=*&component_id=like.*corner*');
```

### Ordering

```javascript
// Order by column
await queryTable('components', 'select=*&order=name.asc');

// Order descending
await queryTable('components', 'select=*&order=created_at.desc');
```

### Complete Example

```javascript
// Get all corner cabinets, ordered by width
const cornerCabinets = await queryTable(
  'components',
  'select=*&component_id=like.*corner*&type=eq.cabinet&order=width.asc'
);
```

---

## Common Use Cases

### 1. Schema Analysis

```javascript
// Get first row to inspect structure
const sample = await queryTable('components', 'select=*&limit=1');
const columns = Object.keys(sample[0]);
console.log('Columns:', columns);
```

### 2. Component Count by Type

```javascript
const components = await queryTable('components', 'select=type');
const counts = {};
components.forEach(c => {
  counts[c.type] = (counts[c.type] || 0) + 1;
});
console.log('By type:', counts);
```

### 3. Find Components with Specific Properties

```javascript
// Components with default_z_position set
const withZ = await queryTable(
  'components',
  'select=component_id,default_z_position&default_z_position=not.is.null'
);
```

### 4. Export to File

```javascript
const data = await queryTable('components', 'select=*');
const report = JSON.stringify(data, null, 2);
fs.writeFileSync('./output/components.json', report, 'utf-8');
console.log('✅ Exported to components.json');
```

---

## Working Example Script

**Reference:** `scripts/query-components-direct.cjs`

This script successfully:
1. ✅ Queries components table
2. ✅ Analyzes schema (28 columns)
3. ✅ Counts components by type (194 total)
4. ✅ Generates markdown report
5. ✅ Saves to `docs/COMPONENTS_TABLE_SCHEMA.md`

**Run command:**
```bash
node scripts/query-components-direct.cjs
```

**Output:**
```
═══════════════════════════════════════════════════
COMPONENTS TABLE SCHEMA ANALYSIS
═══════════════════════════════════════════════════

📊 Components Table Structure:
Total Columns: 28

✓ component_id: string
✓ name: string
✓ type: string
✓ width: number
✓ depth: number
✓ height: number
✓ default_z_position: number  ← EXISTS WITH DATA
✓ corner_configuration: object ← EXISTS WITH DATA
...

Total Components: 194

✅ Report saved to: ./docs/COMPONENTS_TABLE_SCHEMA.md
```

---

## ❌ Methods That DON'T Work

### 1. Supabase CLI with Docker

```bash
# ❌ FAILS - Requires Docker Desktop
npx supabase db dump --schema public

# Error: Docker Desktop is a prerequisite
```

**Problem:** Requires Docker Desktop installation and running daemon.

### 2. RPC Function Calls

```javascript
// ❌ FAILS - Function doesn't exist
await supabase.rpc('execute_sql', { sql: '...' });

// Error: Could not find the function public.execute_sql
```

**Problem:** RPC functions must be created in database first.

### 3. ES Module (.js files)

```javascript
// ❌ FAILS - require() not available in ES modules
const https = require('https');

// Error: require is not defined in ES module scope
```

**Problem:** `package.json` has `"type": "module"`, so `.js` files are treated as ES modules.

**Solution:** Use `.cjs` extension for CommonJS scripts.

---

## Troubleshooting

### Issue: "require is not defined"

**Cause:** Using `.js` extension with ES module mode.

**Solution:** Rename file to `.cjs`

```bash
mv script.js script.cjs
```

### Issue: HTTP 401 Unauthorized

**Cause:** Invalid or missing API key.

**Solution:** Check API key in `.env` file matches Supabase dashboard.

### Issue: HTTP 404 Table Not Found

**Cause:** Table name incorrect or schema not public.

**Solution:** Verify table name and ensure it's in `public` schema.

### Issue: Empty Response

**Cause:** Query filters too restrictive.

**Solution:** Remove filters and try `select=*&limit=1` first.

---

## API Key Security

### ⚠️ IMPORTANT

The anon key in `.env` is **safe to expose** in client-side code:
- ✅ Has limited permissions (anon role)
- ✅ Row-level security (RLS) enforced
- ✅ Cannot access user data without auth

However, for server-side scripts:
- ⚠️ Consider using service role key for admin operations
- ⚠️ Never commit service role key to git
- ⚠️ Use environment variables for CI/CD

### Using Service Role Key (Admin Access)

```javascript
// For admin operations only
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const options = {
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  }
};
```

---

## Integration with Application Code

### Option 1: Direct HTTPS (Scripts Only)

Use the template above for:
- ✅ Build scripts
- ✅ Database analysis
- ✅ Data migration
- ✅ Testing utilities

### Option 2: Supabase JS Client (Application Code)

Use `@supabase/supabase-js` for:
- ✅ React components
- ✅ Frontend queries
- ✅ Real-time subscriptions
- ✅ Authentication

```typescript
// Application code - use Supabase client
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase
  .from('components')
  .select('*')
  .eq('type', 'cabinet');
```

---

## Quick Reference

### Most Common Queries

```javascript
// Get all components
await queryTable('components', 'select=*');

// Get by ID
await queryTable('components', 'select=*&component_id=eq.base-cabinet-60');

// Get by type
await queryTable('components', 'select=*&type=eq.cabinet');

// Get with null check
await queryTable('components', 'select=*&default_z_position=is.null');

// Get with not null check
await queryTable('components', 'select=*&default_z_position=not.is.null');

// Count components
const all = await queryTable('components', 'select=id');
console.log(`Total: ${all.length}`);
```

---

## Standard Workflow

### 1. Create Script

```bash
# Create new .cjs file
touch scripts/my-query.cjs
```

### 2. Copy Template

Copy code from `scripts/query-supabase-template.cjs`

### 3. Customize Main Function

```javascript
async function main() {
  // Your custom logic here
  const data = await queryTable('components', 'select=*');
  // Process data...
}
```

### 4. Run Script

```bash
node scripts/my-query.cjs
```

### 5. Review Output

Check console output or generated files in `docs/` folder.

---

## Success Checklist

When creating a new Supabase query script, verify:

- [ ] File extension is `.cjs` (not `.js`)
- [ ] Using `require()` for imports (CommonJS)
- [ ] SUPABASE_HOST and SUPABASE_KEY constants defined
- [ ] `queryTable()` function copied from template
- [ ] HTTPS headers include both `apikey` and `Authorization`
- [ ] Error handling with try/catch
- [ ] Console output for debugging
- [ ] File output saved to `docs/` folder (if applicable)

---

## Examples in Codebase

### Working Scripts

1. **`scripts/query-components-direct.cjs`** ✅
   - Queries components table
   - Analyzes schema (28 columns)
   - Generates markdown report
   - **Use this as your reference!**

### Failed Attempts (For Learning)

1. **`scripts/query-components-schema.cjs`** ❌
   - Tried to use RPC `execute_sql` function
   - Function doesn't exist in database
   - Lesson: Use REST API directly, not RPC

2. **`scripts/export-schema.ts`** ❌
   - TypeScript file requiring additional setup
   - Tried to use RPC functions
   - Lesson: Stick with simple Node.js `.cjs` scripts

---

## Future Improvements

### Potential Enhancements

1. **Create RPC functions** in Supabase for complex queries
2. **Add TypeScript types** for better intellisense
3. **Create npm scripts** for common queries
4. **Add query builder** utility function
5. **Implement caching** for repeated queries

### Example NPM Script

Add to `package.json`:

```json
{
  "scripts": {
    "db:schema": "node scripts/query-components-direct.cjs",
    "db:count": "node scripts/count-components.cjs",
    "db:export": "node scripts/export-all-data.cjs"
  }
}
```

Then run:
```bash
npm run db:schema
```

---

## Contact & Support

**Supabase Dashboard:** https://app.supabase.com/project/akfdezesupzuvukqiggn

**REST API Docs:** https://supabase.com/docs/guides/api

**PostgREST Syntax:** https://postgrest.org/en/stable/api.html

---

**Last Verified:** 2025-10-12
**Status:** ✅ WORKING
**Reference Script:** `scripts/query-components-direct.cjs`
