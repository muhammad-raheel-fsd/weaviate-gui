"use client";

import { CollectionInfo } from "@/lib/weaviate";

interface CollectionStatsProps {
  collections: CollectionInfo[];
}

export function CollectionStats({ collections }: CollectionStatsProps) {
  if (collections.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="text-yellow-800">
            <h3 className="font-medium">No collections found</h3>
            <p className="text-sm mt-1">
              Check your Weaviate connection or create some collections first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalObjects = collections.reduce((sum, col) => sum + col.count, 0);
  const avgObjectsPerCollection = Math.round(totalObjects / collections.length);
  const largestCollection = collections.reduce((max, col) =>
    col.count > max.count ? col : max
  );

  // Count unique property types
  const allProperties = collections.flatMap((col) => col.properties);
  const propertyTypes = new Set(
    allProperties.flatMap((prop) => prop.dataType || [])
  );

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Collection Overview
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">
            {collections.length}
          </div>
          <div className="text-sm text-gray-600">Collections</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(totalObjects)}
          </div>
          <div className="text-sm text-gray-600">Total Objects</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {formatNumber(avgObjectsPerCollection)}
          </div>
          <div className="text-sm text-gray-600">Avg per Collection</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-2xl font-bold text-orange-600">
            {propertyTypes.size}
          </div>
          <div className="text-sm text-gray-600">Property Types</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="font-medium text-gray-900 mb-2">Largest Collection</h4>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{largestCollection.name}</span> with{" "}
            <span className="font-medium text-green-600">
              {formatNumber(largestCollection.count)}
            </span>{" "}
            objects
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="font-medium text-gray-900 mb-2">Property Types</h4>
          <div className="flex flex-wrap gap-1">
            {Array.from(propertyTypes)
              .sort()
              .map((type) => (
                <span
                  key={type}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    type === "text"
                      ? "bg-green-100 text-green-800"
                      : type === "int"
                      ? "bg-yellow-100 text-yellow-800"
                      : type === "boolean"
                      ? "bg-purple-100 text-purple-800"
                      : type === "uuid"
                      ? "bg-indigo-100 text-indigo-800"
                      : type.includes("[]")
                      ? "bg-orange-100 text-orange-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {type}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
