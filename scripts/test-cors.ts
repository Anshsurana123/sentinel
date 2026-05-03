import 'dotenv/config';

async function testCORS() {
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
  
  const res = await fetch(uploadUrlWithoutKey, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://sentinel-kuw8.onrender.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'x-goog-upload-command, x-goog-upload-offset, content-type'
    }
  });
  console.log('Status:', res.status);
  console.log('A-C-A-O:', res.headers.get('Access-Control-Allow-Origin'));
}
testCORS();
