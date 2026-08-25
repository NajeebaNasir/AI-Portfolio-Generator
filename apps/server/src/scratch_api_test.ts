import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import http from 'http';

async function testApi() {
  const pdfPath = path.resolve('../../Harshil_Awasthi_Resume.pdf');
  const form = new FormData();
  form.append('resume', fs.createReadStream(pdfPath));

  console.log('Sending POST to http://localhost:3001/api/resume/parse...');

  const req = http.request(
    {
      host: 'localhost',
      port: 3001,
      path: '/api/resume/parse',
      method: 'POST',
      headers: form.getHeaders(),
    },
    (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        console.log('HTTP Status:', res.statusCode);
        try {
          const json = JSON.parse(body);
          console.log('API Response Success:', json.success);
          console.log('Engine Used:', json.engineUsed);
          console.log('Projects count:', json.profile?.projects?.length);
          console.log('Projects:', json.profile?.projects?.map((p: any) => p.name));
          console.log('Certifications count:', json.profile?.certifications?.length);
          console.log('Certifications:', json.profile?.certifications?.map((c: any) => c.name));
        } catch (e) {
          console.log('Raw Body:', body);
        }
      });
    }
  );

  form.pipe(req);
}

testApi();
