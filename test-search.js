require('dotenv').config({ path: '.env.local' });
const { findCards } = require('./lib/db.js');

async function test() {
    const res = await findCards('110/080', 'all');
    console.log("Results for 110/080:", res.length);
    if(res.length > 0) {
        console.log("Sample:", res[0].name, res[0].number);
    }
    const res2 = await findCards('110', 'all');
    console.log("Results for 110:", res2.length);
    process.exit(0);
}
test();
