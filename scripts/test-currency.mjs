import { getJpyToHkdRate } from '../lib/currency.js';

console.log("Testing currency fetch...");
const rate = await getJpyToHkdRate();
console.log(`Fetched Rate: ${rate}`);

if (rate > 0.04 && rate < 0.07) {
    console.log("Rate seems reasonable.");
} else {
    console.warn("Rate seems unusual or fallback used.");
}
