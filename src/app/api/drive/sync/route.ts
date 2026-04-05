import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MAX_DEPTH = 5;
const REQUEST_TIMEOUT_MS = 30_000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
}

async function fetchAllOfxFiles(
    folderId: string,
    accessToken: string,
    depth = 0
): Promise<{ files: DriveFile[]; errors: string[] }> {
    const ofxFiles: DriveFile[] = [];
    const errors: string[] = [];

    if (depth >= MAX_DEPTH) {
        errors.push(`Profundidade máxima atingida (${MAX_DEPTH} níveis) — subpastas ignoradas`);
        return { files: ofxFiles, errors };
    }

    let pageToken: string | undefined = undefined;

    do {
        const query = `'${folderId}' in parents and trashed=false`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=nextPageToken,files(id,name,mimeType)&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`;

        try {
            const response = await fetchWithTimeout(url, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) {
                const errText = await response.text();
                errors.push(`Drive API ${response.status}: ${errText.slice(0, 200)}`);
                break;
            }

            const data = await response.json();
            const files: DriveFile[] = data.files || [];

            for (const file of files) {
                if (file.mimeType === 'application/vnd.google-apps.folder') {
                    const subResult = await fetchAllOfxFiles(file.id, accessToken, depth + 1);
                    ofxFiles.push(...subResult.files);
                    errors.push(...subResult.errors);
                } else if (file.name?.toLowerCase().endsWith('.ofx')) {
                    ofxFiles.push(file);
                }
            }

            pageToken = data.nextPageToken;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro desconhecido';
            if (message.includes('aborted')) {
                errors.push(`Timeout ao listar pasta (${REQUEST_TIMEOUT_MS / 1000}s)`);
            } else {
                errors.push(`Erro ao listar pasta: ${message}`);
            }
            break;
        }
    } while (pageToken);

    return { files: ofxFiles, errors };
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        const { folderId } = await req.json();

        if (!folderId) {
            return NextResponse.json({ error: "folderId é obrigatório" }, { status: 400 });
        }

        const { files: ofxFiles, errors } = await fetchAllOfxFiles(folderId, session.accessToken);

        if (ofxFiles.length === 0) {
            return NextResponse.json({ files: [], found: 0, downloaded: 0, errors });
        }

        const downloadedFiles: { id: string; fileName: string; content: string }[] = [];
        const downloadErrors: string[] = [];

        for (const file of ofxFiles) {
            try {
                const downloadRes = await fetchWithTimeout(
                    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
                    { headers: { Authorization: `Bearer ${session.accessToken}` } },
                    15_000
                );

                if (downloadRes.ok) {
                    const content = await downloadRes.text();
                    downloadedFiles.push({ id: file.id, fileName: file.name, content });
                } else {
                    downloadErrors.push(`Falha ao baixar ${file.name}: HTTP ${downloadRes.status}`);
                }
            } catch {
                downloadErrors.push(`Timeout ao baixar ${file.name}`);
            }
        }

        return NextResponse.json({
            files: downloadedFiles,
            found: ofxFiles.length,
            downloaded: downloadedFiles.length,
            errors: [...errors, ...downloadErrors],
        });

    } catch (error) {
        console.error("Error syncing from Drive:", error);
        return NextResponse.json({ error: "Falha ao sincronizar" }, { status: 500 });
    }
}
