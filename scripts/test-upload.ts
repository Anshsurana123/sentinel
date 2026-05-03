import 'dotenv/config';

async function testUpload() {
  const apiKey = process.env.GOOGLE_API_KEY;
  const startRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': '10',
      'X-Goog-Upload-Header-Content-Type': 'application/pdf',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ file: { displayName: 'test.pdf' } })
  });
  
  const uploadUrlStr = startRes.headers.get('x-goog-upload-url');
  if (!uploadUrlStr) return;

  const urlObj = new URL(uploadUrlStr);
  urlObj.searchParams.delete('key');
  const uploadUrlWithoutKey = urlObj.toString();
  
  // POST request simulating the browser (Origin + Content-Type)
  const uploadRes = await fetch(uploadUrlWithoutKey, {
    method: 'POST',
    headers: {
      'Origin': 'http://localhost:3000',
      'X-Goog-Upload-Command': 'upload, finalize',
      'X-Goog-Upload-Offset': '0',
      'Content-Type': 'application/pdf'
    },
    body: 'HelloWorld'
  });
  
  console.log('Upload Status:', uploadRes.status);
  console.log('CORS Header:', uploadRes.headers.get('Access-Control-Allow-Origin'));
  const text = await uploadRes.text();
  console.log('Upload Response:', text);
}
testUpload();
