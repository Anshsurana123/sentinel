import 'dotenv/config';

async function testResumable() {
  const apiKey = process.env.GOOGLE_API_KEY;
  const startRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': '10',
      'X-Goog-Upload-Header-Content-Type': 'text/plain',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ file: { displayName: 'test.txt' } })
  });
  
  const uploadUrlStr = startRes.headers.get('x-goog-upload-url');
  if (!uploadUrlStr) return;

  const urlObj = new URL(uploadUrlStr);
  urlObj.searchParams.delete('key'); // Remove API key
  const uploadUrlWithoutKey = urlObj.toString();
  console.log('URL without key:', uploadUrlWithoutKey);

  // Upload the whole file in one chunk (10 bytes)
  const chunk1 = "HelloWorld";
  const chunk1Res = await fetch(uploadUrlWithoutKey, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Command': 'upload, finalize',
      'X-Goog-Upload-Offset': '0',
    },
    body: chunk1
  });
  console.log('Upload status:', chunk1Res.status);
  const json = await chunk1Res.json();
  console.log('Result:', json);
}
testResumable();
