import parse from './parse_barcode.mjs';

let product = null;
// Single Barcode
if (process.argv.length === 3) {
  product = parse(process.argv[2]);
}

// Double Barcode
if (process.argv.length === 4) {
  product = parse(process.argv[2], process.argv[3]);
}

console.log(product);
