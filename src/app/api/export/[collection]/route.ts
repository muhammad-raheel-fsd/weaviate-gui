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
    const format = searchParams.get("format") || "json";
    const includeVectors = searchParams.get("includeVectors") === "true";
    const limit = parseInt(searchParams.get("limit") || "1000");

    if (!collection) {
      return NextResponse.json(
        { error: "Collection name is required" },
        { status: 400 }
      );
    }

    // Get collection schema first
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

    if (!classSchema) {
      return NextResponse.json(
        { error: `Collection "${collection}" not found` },
        { status: 404 }
      );
    }

    // Build GraphQL query to get all objects
    const properties =
      classSchema.properties?.map((p: any) => p.name).join("\n") || "";
    const vectorClause = includeVectors ? "vector" : "";

    const graphqlQuery = `{
      Get {
        ${collection}(limit: ${limit}) {
          _additional {
            id
            creationTimeUnix
            lastUpdateTimeUnix
            ${vectorClause}
          }
          ${properties}
        }
      }
    }`;

    const response = await fetch(`${connectionStore.url}/v1/graphql`, {
      method: "POST",
      headers: connectionStore.getAuthHeaders(),
      body: JSON.stringify({ query: graphqlQuery }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Export failed: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (result.errors) {
      return NextResponse.json(
        {
          error: "GraphQL query failed",
          details: result.errors,
        },
        { status: 400 }
      );
    }

    const objects = result.data?.Get?.[collection] || [];

    // Prepare export data
    const exportData = {
      collection: collection,
      schema: classSchema,
      exportedAt: new Date().toISOString(),
      totalObjects: objects.length,
      includeVectors: includeVectors,
      objects: objects,
    };

    // Return appropriate format
    if (format === "csv") {
      // Convert to CSV format
      if (objects.length === 0) {
        return new NextResponse("No data to export", { status: 200 });
      }

      const headers = Object.keys(objects[0]).filter(
        (key) => key !== "_additional"
      );
      const csvHeadersArray = [
        "id",
        "creationTimeUnix",
        "lastUpdateTimeUnix",
        ...headers,
      ];
      if (includeVectors) {
        csvHeadersArray.push("vector");
      }
      const csvHeaders = csvHeadersArray.join(",");

      const csvRows = objects.map((obj: any) => {
        const additional = obj._additional || {};
        const values = [
          additional.id || "",
          additional.creationTimeUnix || "",
          additional.lastUpdateTimeUnix || "",
          ...headers.map((header) => {
            const value = obj[header];
            if (Array.isArray(value)) return `"${value.join(";")}"`;
            if (typeof value === "object") return `"${JSON.stringify(value)}"`;
            return `"${value || ""}"`;
          }),
        ];
        // Add vector data if included
        if (includeVectors && additional.vector) {
          values.push(`"${additional.vector.join(";")}"`);
        }
        return values.join(",");
      });

      const csvContent = [csvHeaders, ...csvRows].join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${collection}_export.csv"`,
        },
      });
    }

    // Default JSON format
    return NextResponse.json(exportData, {
      headers: {
        "Content-Disposition": `attachment; filename="${collection}_export.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting collection:", error);
    return NextResponse.json(
      {
        error: "Failed to export collection",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
