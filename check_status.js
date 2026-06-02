const http = require('http');

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({
      host: 'localhost',
      port: port,
      path: port === 5000 ? '/api/users/login' : '/',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.end();
  });
}

async function main() {
  const backend = await checkPort(5000);
  const frontend = await checkPort(5173);
  console.log(`STATUS_JSON: {"backend": ${backend}, "frontend": ${frontend}}`);
}

main();
