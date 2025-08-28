import { NextRequest, NextResponse } from "next/server";
import ConnectionStore from "@/lib/connectionStore";

const connectionStore = ConnectionStore.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, variables } = body;

    if (!query) {
      return NextResponse.json(
        { error: "GraphQL query is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${connectionStore.url}/v1/graphql`, {
      method: "POST",
      headers: connectionStore.getAuthHeaders(),
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      console.error(
        `GraphQL query failed. Status: ${response.status} ${response.statusText}`
      );
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `GraphQL query failed: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error executing GraphQL query:", error);
    return NextResponse.json(
      {
        error: "Failed to execute GraphQL query",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
