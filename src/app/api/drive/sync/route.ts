import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function fetchAllOfxFiles(folderId: string, accessToken: string): Promise<any[]> {
    let ofxFiles: any[] = [];
    let pageToken: string | undefined = undefined;

    do {
        const query: string = `'${folderId}' in parents and trashed=false`;
        const url: string = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=nextPageToken,files(id,name,mimeType)&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`;

        const response: Response = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) throw new Error(`Google Drive API error: ${response.status}`);

        const data: any = await response.json();
        const files: any[] = data.files || [];

        for (const file of files) {
            if (file.mimeType === 'application/vnd.google-apps.folder') {
                // Recursive call for subfolders
                const subfolderFiles = await fetchAllOfxFiles(file.id, accessToken);
                ofxFiles = ofxFiles.concat(subfolderFiles);
            } else if (file.name && file.name.toLowerCase().endsWith('.ofx')) {
                ofxFiles.push(file);
            }
        }

        pageToken = data.nextPageToken;
    } while (pageToken);

    return ofxFiles;
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { folderId } = await req.json();

        if (!folderId) {
            return NextResponse.json({ error: "folderId is required" }, { status: 400 });
        }

        const ofxFiles = await fetchAllOfxFiles(folderId, session.accessToken as string);

        if (ofxFiles.length === 0) {
            return NextResponse.json({ files: [] });
        }

        // Download each OFX file content
        const downloadedFiles = [];
        for (const file of ofxFiles) {
            const downloadRes = await fetch(
                `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
                {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                }
            );

            if (downloadRes.ok) {
                const content = await downloadRes.text();
                downloadedFiles.push({
                    id: file.id,
                    fileName: file.name,
                    content
                });
            }
        }

        return NextResponse.json({ files: downloadedFiles });

    } catch (error) {
        console.error("Error syncing from Drive:", error);
        return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
    }
}
