"use client";

import { useState, useEffect } from "react";

interface EmbeddingsViewProps {
  objectId: string;
  className: string;
  onClose: () => void;
}

interface ObjectWithVector {
  id: string;
  properties: Record<string, unknown>;
  vectors?: {
    default?: number[];
  };
  class: string;
}

export function EmbeddingsView({
  objectId,
  className,
  onClose,
}: EmbeddingsViewProps) {
  const [object, setObject] = useState<ObjectWithVector | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullVector, setShowFullVector] = useState(false);

  useEffect(() => {
    fetchObjectWithVector();
  }, [objectId, className]);

  const fetchObjectWithVector = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/objects/${objectId}?include=vector`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch object");
      }

      setObject(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch object");
    } finally {
      setLoading(false);
    }
  };

  const renderVector = (vector: number[]) => {
    if (!vector || vector.length === 0) {
      return <span className="text-gray-500">No vector data</span>;
    }

    const displayVector = showFullVector ? vector : vector.slice(0, 20);
    const minVal = Math.min(...vector);
    const maxVal = Math.max(...vector);
    const range = maxVal - minVal;

    // Create a histogram for visualization
    const buckets = 20;
    const histogram = new Array(buckets).fill(0);
    vector.forEach((val) => {
      const bucketIndex = Math.min(
        buckets - 1,
        Math.floor(((val - minVal) / range) * buckets)
      );
      histogram[bucketIndex]++;
    });
    const maxCount = Math.max(...histogram);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">
            Embedding Vector
            <span className="ml-2 text-sm font-normal text-gray-500">
              {vector.length} dimensions
            </span>
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFullVector(!showFullVector)}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              {showFullVector ? "Show sample" : "Show all"}
            </button>
          </div>
        </div>

        {/* Vector Distribution Visualization */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
          <h4 className="text-sm font-medium text-gray-700 mb-4">
            Value Distribution
          </h4>
          <div className="flex items-end justify-between h-24 bg-white rounded-lg p-3">
            {histogram.map((count, index) => (
              <div
                key={index}
                className="bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                style={{
                  height: `${(count / maxCount) * 100}%`,
                  width: "4%",
                }}
                title={`Bucket ${index + 1}: ${count} values`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{minVal.toFixed(3)}</span>
            <span>Value Range</span>
            <span>{maxVal.toFixed(3)}</span>
          </div>
        </div>

        {/* Vector Values Grid */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">
            Vector Values{" "}
            {!showFullVector && `(showing first ${displayVector.length})`}
          </h4>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {displayVector.map((value, index) => {
              const intensity = Math.abs(value - minVal) / range;
              const isPositive = value >= 0;
              return (
                <div
                  key={index}
                  className={`relative p-3 rounded-lg border-2 text-center transition-all hover:scale-105 cursor-help ${
                    isPositive
                      ? "bg-green-50 border-green-200 hover:bg-green-100"
                      : "bg-red-50 border-red-200 hover:bg-red-100"
                  }`}
                  style={{
                    opacity: 0.3 + intensity * 0.7,
                  }}
                  title={`Index ${index}: ${value.toFixed(6)}`}
                >
                  <div className="text-xs text-gray-500 font-medium">
                    #{index}
                  </div>
                  <div
                    className={`text-sm font-mono font-bold ${
                      isPositive ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {value.toFixed(3)}
                  </div>
                </div>
              );
            })}
            {!showFullVector && vector.length > displayVector.length && (
              <div className="p-3 rounded-lg border-2 border-dashed border-gray-300 text-center bg-gray-50 flex items-center justify-center">
                <span className="text-xs text-gray-500">
                  +{vector.length - displayVector.length} more
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="text-sm font-medium text-blue-900">Minimum</div>
            <div className="text-lg font-bold text-blue-700 font-mono">
              {minVal.toFixed(4)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="text-sm font-medium text-green-900">Maximum</div>
            <div className="text-lg font-bold text-green-700 font-mono">
              {maxVal.toFixed(4)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <div className="text-sm font-medium text-purple-900">Magnitude</div>
            <div className="text-lg font-bold text-purple-700 font-mono">
              {Math.sqrt(
                vector.reduce((sum, val) => sum + val * val, 0)
              ).toFixed(4)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
            <div className="text-sm font-medium text-orange-900">Mean</div>
            <div className="text-lg font-bold text-orange-700 font-mono">
              {(
                vector.reduce((sum, val) => sum + val, 0) / vector.length
              ).toFixed(4)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProperties = (properties: Record<string, unknown>) => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Object Properties</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          {Object.entries(properties).map(([key, value]) => (
            <div key={key} className="mb-3 last:mb-0">
              <div className="font-medium text-sm text-gray-700 mb-1">
                {key}:
              </div>
              <div className="text-sm text-gray-900 bg-white p-2 rounded border">
                {Array.isArray(value)
                  ? value.join(", ")
                  : typeof value === "object"
                  ? JSON.stringify(value, null, 2)
                  : String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Error</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!object) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Object Embeddings & Details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Class: {object.class} • ID: {object.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-8">
          {object.vectors?.default && renderVector(object.vectors.default)}
          {renderProperties(object.properties)}
        </div>
      </div>
    </div>
  );
}
