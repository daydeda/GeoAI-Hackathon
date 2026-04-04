// Quick verification that responsive classes are present in compiled pages
const fs = require('fs');
const path = require('path');

const responsivePatterns = [
  /sm:/,
  /md:/,
  /lg:/,
  /flex-col\s+sm:flex-row/,
  /grid-cols-1\s+md:grid-cols/,
  /px-4\s+sm:px-/,
  /hidden\s+sm:table-cell/,
];

const pagesDir = './src/app';
const pages = [
  'page.tsx',
  'login/page.tsx',
  'dashboard/page.tsx',
  'team/page.tsx',
  'submissions/page.tsx',
  'admin/page.tsx',
  'admin/logs/page.tsx',
  'judge/page.tsx',
  'documents/page.tsx',
  'resources/page.tsx',
  'moderator/page.tsx',
  'mod/page.tsx',
  'invite/[code]/page.tsx',
];

let allValid = true;
pages.forEach(page => {
  const filePath = path.join(pagesDir, page);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${page} - NOT FOUND`);
    allValid = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const hasResponsive = responsivePatterns.some(pattern => pattern.test(content));
  
  if (hasResponsive) {
    console.log(`✅ ${page} - Responsive patterns found`);
  } else {
    console.log(`⚠️  ${page} - No responsive patterns detected`);
    allValid = false;
  }
});

console.log(`\n${allValid ? '✅ All pages have responsive design' : '❌ Some pages may lack responsive patterns'}`);
process.exit(allValid ? 0 : 1);
