import { NextRequest, NextResponse } from "next/server";
import ConnectionStore from "@/lib/connectionStore";

const connectionStore = ConnectionStore.getInstance();

// Create a backup
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

    const backupPayload = {
      id: backupId,
      config: defaultConfig,
    };

    const response = await fetch(`${connectionStore.url}/v1/backups/${backend}`, {
      method: "POST",
      headers: connectionStore.getAuthHeaders(),
      body: JSON.stringify(backupPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Backup creation failed: ${response.statusText}`,
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
      path: result.path,
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    return NextResponse.json(
      {
        error: "Failed to create backup",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Get backup status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get("backupId");
    const backend = searchParams.get("backend") || "filesystem";

    if (!backupId) {
      return NextResponse.json(
        { error: "Backup ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${connectionStore.url}/v1/backups/${backend}/${backupId}`,
      {
        method: "GET",
        headers: connectionStore.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Failed to get backup status: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error getting backup status:", error);
    return NextResponse.json(
      {
        error: "Failed to get backup status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
