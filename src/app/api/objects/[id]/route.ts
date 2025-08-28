import { NextRequest, NextResponse } from "next/server";
import ConnectionStore from "@/lib/connectionStore";

const connectionStore = ConnectionStore.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const include = searchParams.get("include") || "";

    if (!id) {
      return NextResponse.json(
        { error: "Object ID is required" },
        { status: 400 }
      );
    }

    // Build the URL with include parameter if specified
    const includeParam = include ? `?include=${include}` : "";
    const url = `${connectionStore.url}/v1/objects/${id}${includeParam}`;

    console.log("URL ======================>", url);

    const response = await fetch(url, {
      headers: connectionStore.getAuthHeaders(),
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch object ${id}. Status: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        { error: `Failed to fetch object: ${response.statusText}` },
        { status: response.status }
      );
    }

    const objectData = await response.json();
    console.log("OBJECT DATA ======================>", objectData);
    return NextResponse.json(objectData);
  } catch (error) {
    console.error("Error fetching object:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch object",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
