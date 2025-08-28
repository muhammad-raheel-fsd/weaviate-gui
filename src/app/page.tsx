import { getCollections, getWeaviateUrl } from "@/lib/weaviate";
import { CollectionsWrapper } from "@/components/CollectionsWrapper";
import { WeaviateConnector } from "@/components/WeaviateConnector";
import { Suspense } from "react";

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function getInitialCollections() {
  try {
    console.log("Page - Fetching initial collections");
    const collections = await getCollections();
    console.log(
      `Page - Successfully fetched ${collections.length} collections`
    );
    return collections;
  } catch (error) {
    console.error("Page - Error fetching initial collections:", error);
    return [];
  }
}

export default async function Home() {
  const weaviateUrl = getWeaviateUrl();
  const collections = await getInitialCollections().catch(() => []);

  return (
    <main className="py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Weaviate Collections Browser
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Comprehensive view of collections, documents, and embeddings
          </p>
          <div className="flex items-center mt-3 text-sm">
            <span className="text-gray-500">Connected to:</span>
            <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
              {weaviateUrl}
            </span>
            {collections.length > 0 && (
              <span className="ml-4 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                ✓ Active ({collections.length} collections)
              </span>
            )}
          </div>
        </div>

        <WeaviateConnector initialUrl={weaviateUrl} />

        <Suspense>
          <CollectionsWrapper initialCollections={collections} />
        </Suspense>
      </div>
    </main>
  );
}
