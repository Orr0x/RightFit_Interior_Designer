/**
 * Migration script to replace console.* statements with Logger.* calls
 *
 * Usage: npx tsx scripts/migrate-to-logger.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface FileStats {
  path: string;
  replacements: number;
  errors: string[];
}

const stats: FileStats[] = [];

/**
 * Replace console statements in a file
 */
function migrateFile(filePath: string): FileStats {
  const fileStats: FileStats = {
    path: filePath,
    replacements: 0,
    errors: []
  };

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Skip if already importing Logger
    const hasLoggerImport = content.includes("from '@/utils/Logger'") ||
                           content.includes('from "../utils/Logger"') ||
                           content.includes('from "../../utils/Logger"') ||
                           content.includes('from "../../../utils/Logger"');

    // Skip ConsoleLogger.ts and ABTestLogger.ts (they wrap console intentionally)
    if (filePath.includes('ConsoleLogger.ts') || filePath.includes('ABTestLogger.ts')) {
      console.log(`⏭️  Skipping ${filePath} (logger utility)`);
      return fileStats;
    }

    // Skip test files (they mock console)
    if (filePath.includes('__tests__') || filePath.endsWith('.test.ts') || filePath.endsWith('.test.tsx')) {
      console.log(`⏭️  Skipping ${filePath} (test file)`);
      return fileStats;
    }

    // Count console statements before replacement
    const consoleMatches = content.match(/console\.(log|info|warn|error|debug|group|groupEnd)/g);
    if (!consoleMatches || consoleMatches.length === 0) {
      return fileStats;
    }

    // Replace console statements
    const replacements = [
      // console.log → Logger.debug (most logs are debug-level)
      { pattern: /console\.log\(/g, replacement: 'Logger.debug(' },

      // console.info → Logger.info
      { pattern: /console\.info\(/g, replacement: 'Logger.info(' },

      // console.warn → Logger.warn
      { pattern: /console\.warn\(/g, replacement: 'Logger.warn(' },

      // console.debug → Logger.debug
      { pattern: /console\.debug\(/g, replacement: 'Logger.debug(' },

      // console.group → Logger.group
      { pattern: /console\.group\(/g, replacement: 'Logger.group(' },

      // console.groupEnd → Logger.groupEnd
      { pattern: /console\.groupEnd\(\)/g, replacement: 'Logger.groupEnd()' },

      // console.error → Logger.error (special handling needed)
      // This is tricky because error might have Error object as second param
      { pattern: /console\.error\(/g, replacement: 'Logger.error(' }
    ];

    let totalReplacements = 0;
    for (const { pattern, replacement } of replacements) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        totalReplacements += matches.length;
      }
    }

    // Add Logger import if we made replacements and don't already have it
    if (totalReplacements > 0 && !hasLoggerImport) {
      // Find the right place to add the import (after other imports)
      const importRegex = /^import\s+.+from\s+['"].+['"];?$/gm;
      const imports = content.match(importRegex);

      if (imports && imports.length > 0) {
        // Add after the last import
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertPosition = lastImportIndex + lastImport.length;

        content = content.slice(0, insertPosition) +
                 "\nimport { Logger } from '@/utils/Logger';" +
                 content.slice(insertPosition);
      } else {
        // No imports found, add at the top (after any comments)
        const firstLineRegex = /^(?:\/\/.*\n|\/\*[\s\S]*?\*\/\n)*/;
        const match = content.match(firstLineRegex);
        const insertPosition = match ? match[0].length : 0;

        content = content.slice(0, insertPosition) +
                 "import { Logger } from '@/utils/Logger';\n\n" +
                 content.slice(insertPosition);
      }
    }

    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      fileStats.replacements = totalReplacements;
      console.log(`✅ ${filePath} (${totalReplacements} replacements)`);
    }

  } catch (error) {
    fileStats.errors.push(error instanceof Error ? error.message : String(error));
    console.error(`❌ Error processing ${filePath}:`, error);
  }

  return fileStats;
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting console.* → Logger.* migration...\n');

  // Find all TypeScript/TSX files in src
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/__tests__/**'],
    absolute: true
  });

  console.log(`📁 Found ${files.length} files to process\n`);

  // Process each file
  for (const file of files) {
    const fileStats = migrateFile(file);
    if (fileStats.replacements > 0 || fileStats.errors.length > 0) {
      stats.push(fileStats);
    }
  }

  // Print summary
  console.log('\n📊 Migration Summary');
  console.log('='.repeat(50));

  const totalReplacements = stats.reduce((sum, s) => sum + s.replacements, 0);
  const filesWithErrors = stats.filter(s => s.errors.length > 0);
  const filesModified = stats.filter(s => s.replacements > 0).length;

  console.log(`✅ Files modified: ${filesModified}`);
  console.log(`✅ Total replacements: ${totalReplacements}`);
  console.log(`❌ Files with errors: ${filesWithErrors.length}`);

  if (filesWithErrors.length > 0) {
    console.log('\n❌ Errors:');
    filesWithErrors.forEach(f => {
      console.log(`  ${f.path}:`);
      f.errors.forEach(e => console.log(`    - ${e}`));
    });
  }

  console.log('\n✨ Migration complete!');
  console.log('\n⚠️  Next steps:');
  console.log('1. Review changes with: git diff');
  console.log('2. Run type check: npm run type-check');
  console.log('3. Run tests: npm run test:run');
  console.log('4. Test in browser: npm run dev');
}

main().catch(console.error);
