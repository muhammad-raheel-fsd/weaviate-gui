import { NextRequest, NextResponse } from "next/server";
import ConnectionStore from "@/lib/connectionStore";

const connectionStore = ConnectionStore.getInstance();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const createSchema = formData.get("createSchema") === "true";
    const replaceExisting = formData.get("replaceExisting") === "true";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const fileContent = await file.text();
    let importData;

    try {
      importData = JSON.parse(fileContent);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 }
      );
    }

    // Validate import data structure
    if (
      !importData.collection ||
      !importData.objects ||
      !Array.isArray(importData.objects)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid import format. Expected: { collection, schema, objects }",
        },
        { status: 400 }
      );
    }

    const { collection, schema, objects } = importData;
    const results = {
      collection,
      totalObjects: objects.length,
      imported: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Check if collection exists
    const schemaResponse = await fetch(`${connectionStore.url}/v1/schema`, {
      headers: connectionStore.getAuthHeaders(),
    });

    if (!schemaResponse.ok) {
      throw new Error("Failed to fetch schema");
    }

    const currentSchema = await schemaResponse.json();
    const existingClass = currentSchema.classes?.find(
      (c: any) => c.class === collection
    );

    // Create schema if requested and doesn't exist
    if (!existingClass && createSchema && schema) {
      const createSchemaResponse = await fetch(
        `${connectionStore.url}/v1/schema`,
        {
          method: "POST",
          headers: connectionStore.getAuthHeaders(),
          body: JSON.stringify(schema),
        }
      );

      if (!createSchemaResponse.ok) {
        const errorText = await createSchemaResponse.text();
        return NextResponse.json(
          {
            error: "Failed to create schema",
            details: errorText,
          },
          { status: 400 }
        );
      }
    } else if (!existingClass) {
      return NextResponse.json(
        {
          error: `Collection "${collection}" does not exist. Enable "Create Schema" to create it.`,
        },
        { status: 400 }
      );
    }

    // Delete existing objects if replace is requested
    if (replaceExisting && existingClass) {
      try {
        const deleteResponse = await fetch(
          `${connectionStore.url}/v1/schema/${collection}`,
          {
            method: "DELETE",
            headers: connectionStore.getAuthHeaders(),
          }
        );

        if (deleteResponse.ok && schema) {
          // Recreate the schema
          await fetch(`${connectionStore.url}/v1/schema`, {
            method: "POST",
            headers: connectionStore.getAuthHeaders(),
            body: JSON.stringify(schema),
          });
        }
      } catch (error) {
        console.warn("Failed to delete existing collection:", error);
      }
    }

    // Import objects in batches
    const batchSize = 100;
    for (let i = 0; i < objects.length; i += batchSize) {
      const batch = objects.slice(i, i + batchSize);
      const batchObjects = batch.map((obj: any) => {
        const { _additional, ...properties } = obj;
        return {
          class: collection,
          id: _additional?.id,
          properties,
          vector: _additional?.vector,
        };
      });

      try {
        const batchResponse = await fetch(
          `${connectionStore.url}/v1/batch/objects`,
          {
            method: "POST",
            headers: connectionStore.getAuthHeaders(),
            body: JSON.stringify({ objects: batchObjects }),
          }
        );

        if (batchResponse.ok) {
          const batchResult = await batchResponse.json();

          // Count successful imports
          batchResult.forEach((result: any) => {
            if (result.result?.errors) {
              results.failed++;
              results.errors.push(
                result.result.errors.error?.[0]?.message || "Unknown error"
              );
            } else {
              results.imported++;
            }
          });
        } else {
          const errorText = await batchResponse.text();
          results.failed += batch.length;
          results.errors.push(
            `Batch ${i / batchSize + 1} failed: ${errorText}`
          );
        }
      } catch (error) {
        results.failed += batch.length;
        results.errors.push(`Batch ${i / batchSize + 1} error: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error importing data:", error);
    return NextResponse.json(
      {
        error: "Failed to import data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
