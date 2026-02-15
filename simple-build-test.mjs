// Simple syntax check of the problematic files
import { readFileSync } from 'fs';

const files = [
  'app/legacy/create/page.tsx',
  'components/legacy/QuestBuilder.tsx',
  'components/legacy/VideoMessageSection.tsx',
  'components/legacy/VideoUploader.tsx',
  'components/legacy/VideoRecorder.tsx'
];

console.log('Checking files for syntax errors...\n');

for (const file of files) {
  try {
    const content = readFileSync(file, 'utf8');
    console.log(`✓ ${file} - ${content.length} bytes`);
    
    // Check for common issues
    if (content.includes('import') && !content.includes("'use client'") && file.includes('components/')) {
      console.log(`  ⚠️  Missing 'use client' directive`);
    }
    
  } catch (err) {
    console.log(`✗ ${file} - ${err.message}`);
  }
}
