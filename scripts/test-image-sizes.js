const https = require('https');

const baseUrl = 'https://storage.googleapis.com/images.pricecharting.com/0009cbeefe798f92d0d3f0e09f15457545df068f3f39f72fb4b371d4dfc5efee/';
const suffixes = ['60.jpg', '240.jpg', '300.jpg', '480.jpg', '600.jpg', '800.jpg', '1200.jpg', 'original.jpg', 'image.jpg'];

async function checkUrl(suffix) {
    return new Promise((resolve) => {
        const url = baseUrl + suffix;
        const req = https.request(url, { method: 'HEAD' }, (res) => {
            resolve({ suffix, status: res.statusCode });
        });
        req.on('error', () => resolve({ suffix, status: 'error' }));
        req.end();
    });
}

async function run() {
    console.log('Testing image sizes for:', baseUrl);
    for (const suffix of suffixes) {
        const result = await checkUrl(suffix);
        console.log(`${result.suffix}: ${result.status}`);
    }
}

run();
