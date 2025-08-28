import { NextRequest, NextResponse } from "next/server";
import ConnectionStore from "@/lib/connectionStore";

const connectionStore = ConnectionStore.getInstance();

// Restore from backup
export async function POST(request: NextRequest) {
  try {
    const { backupId, backend = "filesystem", config = {} } = await request.json();

    if (!backupId) {
      return NextResponse.json(
        { error: "Backup ID is required" },
        { status: 400 }
      );
    }

    // Default config for filesystem backend
    const defaultConfig = {
      path: "/tmp/weaviate-backups",
      ...config,
    };

    const restorePayload = {
      config: defaultConfig,
    };

    const response = await fetch(
      `${connectionStore.url}/v1/backups/${backend}/${backupId}/restore`,
      {
        method: "POST",
        headers: connectionStore.getAuthHeaders(),
        body: JSON.stringify(restorePayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Restore failed: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      backupId,
      backend,
      status: result.status,
    });
  } catch (error) {
    console.error("Error restoring backup:", error);
    return NextResponse.json(
      {
        error: "Failed to restore backup",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
