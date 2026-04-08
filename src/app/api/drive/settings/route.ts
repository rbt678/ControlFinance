import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const REQUEST_TIMEOUT_MS = 15_000;
const SETTINGS_FILENAME = "_controlfinance_settings.json";

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

async function findSettingsFile(folderId: string, accessToken: string): Promise<string | null> {
    const query = `'${folderId}' in parents and name='${SETTINGS_FILENAME}' and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)&pageSize=1`;

    const res = await fetchWithTimeout(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const files = data.files || [];
    return files.length > 0 ? files[0].id : null;
}

// GET: Download settings from Drive
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const folderId = searchParams.get("folderId");

        if (!folderId) {
            return NextResponse.json({ error: "folderId é obrigatório" }, { status: 400 });
        }

        const fileId = await findSettingsFile(folderId, session.accessToken);
        if (!fileId) {
            return NextResponse.json({ settings: null });
        }

        const downloadRes = await fetchWithTimeout(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            { headers: { Authorization: `Bearer ${session.accessToken}` } }
        );

        if (!downloadRes.ok) {
            return NextResponse.json({ error: "Falha ao baixar configurações" }, { status: 500 });
        }

        const content = await downloadRes.text();
        const settings = JSON.parse(content);
        return NextResponse.json({ settings, fileId });

    } catch (error) {
        console.error("Error reading settings from Drive:", error);
        return NextResponse.json({ error: "Falha ao ler configurações" }, { status: 500 });
    }
}

// POST: Upload settings to Drive (create or update)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        const { folderId, settings } = await req.json();

        if (!folderId || !settings) {
            return NextResponse.json({ error: "folderId e settings são obrigatórios" }, { status: 400 });
        }

        const settingsJson = JSON.stringify(settings, null, 2);
        const existingFileId = await findSettingsFile(folderId, session.accessToken);

        if (existingFileId) {
            // Update existing file
            const updateRes = await fetchWithTimeout(
                `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: settingsJson,
                }
            );

            if (!updateRes.ok) {
                const errText = await updateRes.text();
                console.error("Drive update error:", errText);
                return NextResponse.json({ error: "Falha ao atualizar configurações" }, { status: 500 });
            }

            return NextResponse.json({ success: true, action: "updated", fileId: existingFileId });
        } else {
            // Create new file with multipart upload
            const boundary = "settings_boundary_" + Date.now();
            const metadata = JSON.stringify({
                name: SETTINGS_FILENAME,
                parents: [folderId],
                mimeType: "application/json",
            });

            const multipartBody =
                `--${boundary}\r\n` +
                `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
                `${metadata}\r\n` +
                `--${boundary}\r\n` +
                `Content-Type: application/json\r\n\r\n` +
                `${settingsJson}\r\n` +
                `--${boundary}--`;

            const createRes = await fetchWithTimeout(
                `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                        "Content-Type": `multipart/related; boundary=${boundary}`,
                    },
                    body: multipartBody,
                }
            );

            if (!createRes.ok) {
                const errText = await createRes.text();
                console.error("Drive create error:", errText);
                return NextResponse.json({ error: "Falha ao criar configurações" }, { status: 500 });
            }

            const created = await createRes.json();
            return NextResponse.json({ success: true, action: "created", fileId: created.id });
        }

    } catch (error) {
        console.error("Error writing settings to Drive:", error);
        return NextResponse.json({ error: "Falha ao salvar configurações" }, { status: 500 });
    }
}
