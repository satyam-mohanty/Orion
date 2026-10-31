const fs = require('fs');
const Tesseract = require('tesseract.js');

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error(JSON.stringify({ error: 'No image path provided' }));
    process.exit(1);
  }

  try {
    const worker = await Tesseract.createWorker('eng');
    const ret = await worker.recognize(filePath);
    await worker.terminate();

    console.log(JSON.stringify({
      text: (ret.data.text || '').trim(),
      confidence: ret.data.confidence || 0
    }));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message || String(err) }));
    process.exit(1);
  }
}

main();
