#!/usr/bin/env node

/**
 * Cleanup Script - Remove Old Backend Files
 * 
 * This script removes the old Express backend and related files
 * after successful migration to Next.js API routes.
 * 
 * ⚠️ WARNING: This script will permanently delete files!
 * Only run this after confirming the new Next.js backend is working.
 * 
 * Usage:
 *   node scripts/cleanup-old-backend.js
 * 
 * To preview what will be deleted (dry run):
 *   node scripts/cleanup-old-backend.js --dry-run
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('--dryrun');

const FILES_TO_DELETE = [
  // Old backend directory
  'apps/api',
  
  // Server configuration files
  'ecosystem.config.js',
  'render.yaml',
  
  // MongoDB scripts
  'start-mongodb.bat',
  'start-mongodb.ps1',
  
  // Server setup scripts
  'setup-server.sh',
  'setup-server-monorepo.sh',
  'create-server-package.json.sh',
  'create-packages-on-server.sh',
  'server-commands.txt',
  
  // Environment check scripts
  'check-render-env.js',
  'add-render-env.sh',
  
  // Old documentation files
  'FULL-PACKAGE-JSON.txt',
  'CLEAN-AND-RESTART.md',
];

const PATTERNS_TO_DELETE = [
  // Documentation files matching patterns
  /^FIX-.*\.md$/i,
  /^CHECK-.*\.md$/i,
  /^SERVER-.*\.md$/i,
  /^RENDER-.*\.md$/i,
];

const FILES_TO_KEEP = [
  'apps/web',
  'packages',
  'config',
  'package.json',
  'package-lock.json',
  'turbo.json',
  '.env',
  '.gitignore',
  'README.md',
  'ENV.md',
  'DEPLOYMENT.md',
  'VALIDATION.md',
  'VALIDATION-REPORT.md',
  'VALIDATION-SECTION-4.md',
  'MIGRATION-COMPLETE.md',
  'PROGRESS.md',
  'plan.md',
  'scripts',
  'vercel.json',
];

function findFilesByPattern(dir, patterns) {
  const files = [];
  
  function walkDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);
      
      // Skip node_modules and .git
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') {
        continue;
      }
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile()) {
        for (const pattern of patterns) {
          if (pattern.test(entry.name)) {
            files.push(relativePath);
            break;
          }
        }
      }
    }
  }
  
  walkDir(dir);
  return files;
}

function deleteFile(filePath) {
  const fullPath = path.resolve(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return { success: false, error: 'File does not exist' };
  }
  
  try {
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      if (DRY_RUN) {
        return { success: true, action: 'Would delete directory' };
      }
      fs.rmSync(fullPath, { recursive: true, force: true });
      return { success: true, action: 'Deleted directory' };
    } else {
      if (DRY_RUN) {
        return { success: true, action: 'Would delete file' };
      }
      fs.unlinkSync(fullPath);
      return { success: true, action: 'Deleted file' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function main() {
  console.log('🧹 Cleanup Script - Remove Old Backend Files\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No files will be deleted\n');
  } else {
    console.log('⚠️  WARNING: This will permanently delete files!\n');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    // Wait 5 seconds
    const start = Date.now();
    while (Date.now() - start < 5000) {
      // Wait
    }
  }
  
  console.log('='.repeat(60) + '\n');
  
  const results = {
    deleted: [],
    failed: [],
    skipped: [],
  };
  
  // Delete explicit files
  console.log('📁 Deleting explicit files:\n');
  for (const file of FILES_TO_DELETE) {
    const result = deleteFile(file);
    if (result.success) {
      console.log(`  ✅ ${result.action}: ${file}`);
      results.deleted.push(file);
    } else {
      if (result.error === 'File does not exist') {
        console.log(`  ⏭️  Skipped (not found): ${file}`);
        results.skipped.push(file);
      } else {
        console.log(`  ❌ Failed: ${file} - ${result.error}`);
        results.failed.push({ file, error: result.error });
      }
    }
  }
  
  // Find and delete files matching patterns
  console.log('\n📋 Finding files matching patterns:\n');
  const rootDir = process.cwd();
  const patternFiles = findFilesByPattern(rootDir, PATTERNS_TO_DELETE);
  
  if (patternFiles.length > 0) {
    for (const file of patternFiles) {
      const result = deleteFile(file);
      if (result.success) {
        console.log(`  ✅ ${result.action}: ${file}`);
        results.deleted.push(file);
      } else {
        console.log(`  ❌ Failed: ${file} - ${result.error}`);
        results.failed.push({ file, error: result.error });
      }
    }
  } else {
    console.log('  ℹ️  No files found matching patterns');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:\n');
  console.log(`  ✅ Deleted: ${results.deleted.length}`);
  console.log(`  ⏭️  Skipped: ${results.skipped.length}`);
  console.log(`  ❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed files:\n');
    results.failed.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }
  
  if (DRY_RUN) {
    console.log('\n💡 This was a dry run. Run without --dry-run to actually delete files.');
  } else if (results.deleted.length > 0) {
    console.log('\n✅ Cleanup completed!');
    console.log('\n📝 Next steps:');
    console.log('  1. Verify the application still works');
    console.log('  2. Commit the changes');
    console.log('  3. Update deployment configuration if needed');
  }
  
  return results.failed.length === 0 ? 0 : 1;
}

// Run cleanup
const exitCode = main();
process.exit(exitCode);

