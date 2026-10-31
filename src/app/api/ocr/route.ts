import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write to a temporary file
    const ext = path.extname(file.name) || '.png';
    tempFilePath = path.join(os.tmpdir(), `orion-ocr-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    await fs.writeFile(tempFilePath, buffer);

    const scriptPath = path.resolve(process.cwd(), 'scripts/ocr-runner.js');
    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath, tempFilePath], {
      timeout: 30000,
    });

    if (!stdout && stderr) {
      throw new Error(stderr);
    }

    const result = JSON.parse(stdout);
    return NextResponse.json({
      text: result.text || '',
      confidence: result.confidence || 0,
      filename: file.name
    });
  } catch (error: any) {
    console.error('Server OCR error:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from image: ' + (error.message || error) },
      { status: 500 }
    );
  } finally {
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch {
        // ignore cleanup error
      }
    }
  }
}
