#!/usr/bin/env node

/**
 * Frontend Deduplication Scanner & Fixer
 * 
 * Detects and fixes duplicated/concatenated TypeScript/TSX files.
 * Common patterns:
 * - File contains valid code, then a second copy of header/imports/exports
 * - Orphaned comment fragments (e.g., "* Some text" outside block comments)
 * - Repeated export declarations
 * 
 * Usage:
 *   node scripts/dedupe-frontend.mjs           # Dry run (report only)
 *   node scripts/dedupe-frontend.mjs --write   # Fix files (creates .bak backups)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WRITE_MODE = process.argv.includes('--write');
const SRC_DIR = path.resolve(__dirname, '../src');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

/**
 * Recursively find all .ts and .tsx files in a directory
 */
function findSourceFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      results.push(...findSourceFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  
  return results;
}

/**
 * Compute a signature from the first N non-empty lines
 * (typically captures header comments + imports)
 */
function computeFileSignature(lines, count = 20) {
  const nonEmptyLines = lines
    .filter(line => line.trim().length > 0)
    .slice(0, count);
  
  return nonEmptyLines.join('\n');
}

/**
 * Detect if a file has duplicated content
 * Returns the line number where duplication starts, or null
 */
function detectDuplication(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Strategy 1: Look for repeated file signature
  const signature = computeFileSignature(lines, 15);
  if (signature.length > 100) {
    // Find if this signature appears again later in the file
    const sigLines = signature.split('\n');
    const firstLine = sigLines[0];
    
    // Find all occurrences of the first signature line
    const occurrences = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === firstLine.trim()) {
        occurrences.push(i);
      }
    }
    
    // If we have more than one occurrence, check if it's a real duplication
    if (occurrences.length > 1) {
      for (let i = 1; i < occurrences.length; i++) {
        const startLine = occurrences[i];
        let matchCount = 0;
        
        // Check if at least 5 lines match
        for (let j = 0; j < Math.min(sigLines.length, 10); j++) {
          if (startLine + j < lines.length && 
              lines[startLine + j].trim() === sigLines[j].trim()) {
            matchCount++;
          }
        }
        
        if (matchCount >= 5) {
          return {
            line: startLine + 1,
            type: 'repeated-signature',
            confidence: 'high'
          };
        }
      }
    }
  }
  
  // Strategy 2: Look for repeated export declarations
  const exports = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const exportMatch = line.match(/^export\s+(const|function|class|interface|type|enum)\s+(\w+)/);
    
    if (exportMatch) {
      const name = exportMatch[2];
      if (exports[name]) {
        // Found duplicate export
        return {
          line: i + 1,
          type: 'duplicate-export',
          name: name,
          confidence: 'high'
        };
      }
      exports[name] = i + 1;
    }
  }
  
  // Strategy 3: Look for orphaned comment fragments
  // (comment lines starting with " * " but not inside a block comment)
  let inBlockComment = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (trimmed.startsWith('/*')) inBlockComment = true;
    if (trimmed.includes('*/')) inBlockComment = false;
    
    // Orphaned comment line outside block
    if (!inBlockComment && /^\s*\*\s+/.test(line) && !trimmed.startsWith('*/')) {
      // Check if previous line is also a comment or import/export
      if (i > 0) {
        const prevLine = lines[i - 1].trim();
        if (!prevLine.startsWith('*') && 
            !prevLine.startsWith('/*') &&
            !prevLine.startsWith('//') &&
            prevLine !== '') {
          return {
            line: i + 1,
            type: 'orphaned-comment',
            confidence: 'medium'
          };
        }
      }
    }
  }
  
  // Strategy 4: Look for import statements appearing after the main code block
  // (imports should be at the top)
  let foundNonImport = false;
  let firstCodeLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    
    if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*') || 
        trimmed.startsWith('*') || trimmed === '*/') {
      continue;
    }
    
    if (trimmed.startsWith('import ')) {
      if (foundNonImport && i > 50) {
        // Import after substantial code = likely duplication
        return {
          line: i + 1,
          type: 'misplaced-import',
          confidence: 'high'
        };
      }
    } else {
      if (!foundNonImport) {
        foundNonImport = true;
        firstCodeLine = i;
      }
    }
  }
  
  return null;
}

/**
 * Fix a file by truncating at the duplication point
 */
function fixFile(filePath, dupInfo) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Create backup
  const backupPath = filePath + '.bak';
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, content, 'utf8');
  }
  
  // Truncate at duplication line (keep lines before it)
  const cleanedLines = lines.slice(0, dupInfo.line - 1);
  const cleanedContent = cleanedLines.join('\n') + '\n';
  
  fs.writeFileSync(filePath, cleanedContent, 'utf8');
}

/**
 * Main execution
 */
function main() {
  log(colors.cyan, '\n🔍 Scanning frontend for duplicated files...\n');
  log(colors.blue, `Source directory: ${SRC_DIR}`);
  log(colors.blue, `Mode: ${WRITE_MODE ? 'WRITE (will fix files)' : 'DRY RUN (report only)'}\n`);
  
  const files = findSourceFiles(SRC_DIR);
  log(colors.blue, `Found ${files.length} TypeScript/TSX files\n`);
  
  const duplicatedFiles = [];
  
  for (const file of files) {
    const relativePath = path.relative(SRC_DIR, file);
    const dupInfo = detectDuplication(file);
    
    if (dupInfo) {
      duplicatedFiles.push({ file, relativePath, dupInfo });
    }
  }
  
  if (duplicatedFiles.length === 0) {
    log(colors.green, '✅ No duplicated files found! Frontend is clean.\n');
    process.exit(0);
  }
  
  // Report duplicated files
  log(colors.yellow, `⚠️  Found ${duplicatedFiles.length} file(s) with duplication:\n`);
  
  for (const { relativePath, dupInfo } of duplicatedFiles) {
    log(colors.red, `  ❌ ${relativePath}`);
    log(colors.reset, `     → Duplication starts at line ${dupInfo.line}`);
    log(colors.reset, `     → Type: ${dupInfo.type} (${dupInfo.confidence} confidence)`);
    if (dupInfo.name) {
      log(colors.reset, `     → Duplicate symbol: ${dupInfo.name}`);
    }
    console.log();
  }
  
  if (!WRITE_MODE) {
    log(colors.yellow, '💡 Run with --write to fix these files (backups will be created)\n');
    process.exit(1);
  }
  
  // Fix files
  log(colors.cyan, '🔧 Fixing files...\n');
  
  for (const { file, relativePath, dupInfo } of duplicatedFiles) {
    try {
      fixFile(file, dupInfo);
      log(colors.green, `  ✅ Fixed: ${relativePath}`);
      log(colors.reset, `     → Truncated at line ${dupInfo.line}`);
      log(colors.reset, `     → Backup: ${relativePath}.bak\n`);
    } catch (error) {
      log(colors.red, `  ❌ Failed to fix: ${relativePath}`);
      log(colors.red, `     → Error: ${error.message}\n`);
    }
  }
  
  log(colors.green, '\n✅ Deduplication complete!\n');
  log(colors.yellow, '💡 Run the check again to verify all issues are resolved.\n');
}

main();












