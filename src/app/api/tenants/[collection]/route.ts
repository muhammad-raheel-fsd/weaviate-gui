import { NextRequest, NextResponse } from "next/server";
import ConnectionStore from "@/lib/connectionStore";

const connectionStore = ConnectionStore.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection } = await params;

    if (!collection) {
      return NextResponse.json(
        { error: "Collection name is required" },
        { status: 400 }
      );
    }

    // Fetch tenants from Weaviate
    const response = await fetch(
      `${connectionStore.url}/v1/schema/${collection}/tenants`,
      { headers: connectionStore.getAuthHeaders() }
    );

    if (!response.ok) {
      // Collection might not be multi-tenant (404) or other error
      if (response.status === 404) {
        return NextResponse.json({
          tenants: [],
          isMultiTenant: false,
          message: "Collection is not multi-tenant enabled",
        });
      }
      throw new Error(`Failed to fetch tenants: ${response.statusText}`);
    }

    const tenantsData = await response.json();

    // Filter to only ACTIVE tenants
    const activeTenants = tenantsData
      .filter(
        (t: { name: string; activityStatus: string }) =>
          t.activityStatus === "ACTIVE" || t.activityStatus === "HOT"
      )
      .map((t: { name: string }) => t.name);

    return NextResponse.json({
      tenants: activeTenants,
      isMultiTenant: true,
      total: activeTenants.length,
    });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tenants",
        details: error instanceof Error ? error.message : String(error),
        tenants: [],
        isMultiTenant: false,
      },
      { status: 500 }
    );
  }
}
