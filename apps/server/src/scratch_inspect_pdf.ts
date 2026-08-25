import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

async function deepInspectPdf() {
  const pdfPath = path.resolve(__dirname, '../../../Harshil_Awasthi_Resume.pdf');
  const buffer = fs.readFileSync(pdfPath);

  console.log('=== STEP 1: PARSED TEXT OUTPUT FROM PDF-PARSE ===');
  const data = await pdf(buffer);
  console.log(data.text);

  console.log('\n=== STEP 2: RAW BINARY SEARCH FOR REGEX (http/https/www/github/linkedin) ===');
  const rawStr = buffer.toString('utf8');
  
  // Search for any URI or http/https strings
  const uriMatches = rawStr.match(/\/URI\s*\([^\)]+\)/gi) || [];
  console.log('PDF /URI Annotations found:', uriMatches);

  const httpMatches = rawStr.match(/https?:\/\/[^\s\)\>\<\,\]\"'\\]+/gi) || [];
  console.log('HTTP/HTTPS matches found in binary:', httpMatches);

  const wwwMatches = rawStr.match(/www\.[^\s\)\>\<\,\]\"'\\]+/gi) || [];
  console.log('WWW matches found in binary:', wwwMatches);

  console.log('\n=== STEP 3: SEARCH FOR "github" OR "linkedin" OR "Project Link" IN RAW BINARY ===');
  const lines = data.text.split('\n');
  lines.forEach((line, i) => {
    if (line.toLowerCase().includes('github') || line.toLowerCase().includes('linkedin') || line.toLowerCase().includes('project link')) {
      console.log(`Line ${i + 1}: "${line.trim()}"`);
    }
  });
}

deepInspectPdf();
