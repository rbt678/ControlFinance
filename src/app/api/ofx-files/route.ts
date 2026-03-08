import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const ofxDir = path.join(process.cwd(), 'ofx-data');
        const ofxFiles: { fileName: string; content: string }[] = [];

        if (!fs.existsSync(ofxDir)) {
            return NextResponse.json({ files: [], count: 0, message: 'Pasta ofx-data/ não encontrada' });
        }

        // Scan ofx-data/ subfolder for .ofx files
        const entries = fs.readdirSync(ofxDir);
        for (const entry of entries) {
            if (entry.toLowerCase().endsWith('.ofx')) {
                const filePath = path.join(ofxDir, entry);
                const stat = fs.statSync(filePath);
                if (stat.isFile()) {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    ofxFiles.push({ fileName: entry, content });
                }
            }
        }

        return NextResponse.json({ files: ofxFiles, count: ofxFiles.length });
    } catch (error) {
        console.error('Error reading OFX files:', error);
        return NextResponse.json({ files: [], count: 0, error: 'Failed to read directory' }, { status: 500 });
    }
}
