import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const REQUEST_TIMEOUT_MS = 15_000;

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        const allFolders: { id: string; name: string }[] = [];
        let pageToken: string | undefined = undefined;

        do {
            const url: string = `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder' and trashed=false and 'me' in owners&fields=nextPageToken,files(id,name,parents)&orderBy=name&pageSize=200${pageToken ? `&pageToken=${pageToken}` : ''}`;

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

            try {
                const response: Response = await fetch(url, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    const err = await response.text();
                    console.error("Drive API Error:", err);
                    throw new Error(`Drive API responded with ${response.status}`);
                }

                const data: { files?: { id: string; name: string; parents?: string[] }[]; nextPageToken?: string } = await response.json();
                const files = data.files || [];
                allFolders.push(...(files as any));
                pageToken = data.nextPageToken;
            } finally {
                clearTimeout(timer);
            }
        } while (pageToken);

        return NextResponse.json({ folders: allFolders });
    } catch (error) {
        console.error("Error fetching Drive folders:", error);
        const message = error instanceof Error && error.message.includes('aborted')
            ? "Timeout ao buscar pastas do Drive"
            : "Falha ao buscar pastas";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
