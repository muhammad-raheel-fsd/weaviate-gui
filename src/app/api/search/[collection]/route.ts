import { NextRequest, NextResponse } from "next/server";
import ConnectionStore from "@/lib/connectionStore";

const connectionStore = ConnectionStore.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection } = await params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Build GraphQL query with BM25 search
    const graphqlQuery = `{
      Get {
        ${collection}(
          bm25: {
            query: "${query.replace(/"/g, '\\"')}"
          }
          limit: ${limit}
          offset: ${offset}
        ) {
          _additional {
            id
            score
          }
          ${await getCollectionProperties(collection)}
        }
      }
    }`;

    const response = await fetch(`${connectionStore.url}/v1/graphql`, {
      method: "POST",
      headers: connectionStore.getAuthHeaders(),
      body: JSON.stringify({ query: graphqlQuery }),
    });

    if (!response.ok) {
      console.error(
        `Search failed for collection "${collection}". Status: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        { error: `Search failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      return NextResponse.json(
        { error: "Search query failed", details: result.errors },
        { status: 400 }
      );
    }

    const searchResults = result.data?.Get?.[collection] || [];

    return NextResponse.json({
      data: searchResults,
      query,
      total: searchResults.length,
    });
  } catch (error) {
    console.error("Error executing search:", error);
    return NextResponse.json(
      {
        error: "Failed to execute search",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Helper function to get collection properties dynamically
async function getCollectionProperties(collection: string): Promise<string> {
  try {
    const schemaResponse = await fetch(`${connectionStore.url}/v1/schema`, {
      headers: connectionStore.getAuthHeaders(),
    });

    if (!schemaResponse.ok) {
      throw new Error("Failed to fetch schema");
    }

    const schema = await schemaResponse.json();
    const classSchema = schema.classes?.find(
      (c: any) => c.class === collection
    );

    if (!classSchema?.properties) {
      return ""; // Return empty if no properties found
    }

    // Return first 10 properties to avoid query size issues
    return classSchema.properties
      .slice(0, 10)
      .map((prop: any) => prop.name)
      .join("\n");
  } catch (error) {
    console.error("Error fetching collection properties:", error);
    return ""; // Return empty string on error
  }
}
