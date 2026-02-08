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
    const tenant = searchParams.get("tenant") || "";

    if (!id) {
      return NextResponse.json(
        { error: "Object ID is required" },
        { status: 400 }
      );
    }

    // Build the URL with include and tenant parameters
    const queryParams = new URLSearchParams();
    if (include) queryParams.set("include", include);
    if (tenant) queryParams.set("tenant", tenant);
    const queryString = queryParams.toString();
    const url = `${connectionStore.url}/v1/objects/${id}${queryString ? `?${queryString}` : ""}`;

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
