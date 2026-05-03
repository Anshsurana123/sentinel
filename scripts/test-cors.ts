async function testCORS() {
  const res = await fetch('https://generativelanguage.googleapis.com/upload/v1beta/files', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'POST'
    }
  });
  console.log('Status:', res.status);
  console.log('A-C-A-O:', res.headers.get('Access-Control-Allow-Origin'));
}
testCORS();
