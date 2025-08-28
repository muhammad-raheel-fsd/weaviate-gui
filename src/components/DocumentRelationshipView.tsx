"use client";

import { useState, useEffect } from "react";

interface DocumentRelationshipViewProps {
  documentId: string;
  onClose: () => void;
}

interface DocumentData {
  id: string;
  properties: Record<string, unknown>;
  class: string;
}

interface RelatedChunk {
  id: string;
  properties: {
    content?: string;
    parentChunkId?: string;
    productNumbers?: string[];
    productNames?: string[];
    keywords?: string[];
  };
}

export function DocumentRelationshipView({
  documentId,
  onClose,
}: DocumentRelationshipViewProps) {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [parentChunks, setParentChunks] = useState<RelatedChunk[]>([]);
  const [childChunks, setChildChunks] = useState<RelatedChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocumentAndRelated();
  }, [documentId]);

  const fetchDocumentAndRelated = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the main document
      const docResponse = await fetch(`/api/objects/${documentId}`);
      if (!docResponse.ok) {
        throw new Error("Failed to fetch document");
      }
      const docData = await docResponse.json();
      setDocument(docData);

      // Fetch related parent chunks
      const fileId = docData.properties?.fileId;
      if (fileId) {
        const parentQuery = `{
          Get {
            DocumentParentChunks(where: {
              path: ["fileId"],
              operator: Equal,
              valueText: "${fileId}"
            }, limit: 50) {
              _additional { id }
              content
              title
              productNumbers
              pageNumbers
              fileId
            }
          }
        }`;

        const parentResponse = await fetch("/api/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: parentQuery }),
        });

        if (parentResponse.ok) {
          const parentResult = await parentResponse.json();
          const parentData = parentResult.data?.Get?.DocumentParentChunks || [];
          setParentChunks(
            parentData.map((chunk: any) => ({
              id: chunk._additional.id,
              properties: chunk,
            }))
          );
        }

        // Fetch related child chunks
        const childQuery = `{
          Get {
            DocumentChildChunks(where: {
              path: ["fileId"],
              operator: Equal,
              valueText: "${fileId}"
            }, limit: 100) {
              _additional { id }
              content
              productNumbers
              productNames
              keywords
              parentChunkId
              fileId
            }
          }
        }`;

        const childResponse = await fetch("/api/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: childQuery }),
        });

        if (childResponse.ok) {
          const childResult = await childResponse.json();
          const childData = childResult.data?.Get?.DocumentChildChunks || [];
          setChildChunks(
            childData.map((chunk: any) => ({
              id: chunk._additional.id,
              properties: chunk,
            }))
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch document relationships"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderDocumentInfo = (doc: DocumentData) => {
    const props = doc.properties;
    return (
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-3">
          Document Information
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">File Name:</span>
            <div className="text-blue-700">
              {String(props.fileName || "N/A")}
            </div>
          </div>
          <div>
            <span className="font-medium text-blue-800">File Size:</span>
            <div className="text-blue-700">
              {props.fileSize ? `${props.fileSize} bytes` : "N/A"}
            </div>
          </div>
          <div>
            <span className="font-medium text-blue-800">Title:</span>
            <div className="text-blue-700">{String(props.title || "N/A")}</div>
          </div>
          <div>
            <span className="font-medium text-blue-800">Category:</span>
            <div className="text-blue-700">
              {String(props.category || "N/A")}
            </div>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-blue-800">Description:</span>
            <div className="text-blue-700 mt-1">
              {String(props.description || "N/A")}
            </div>
          </div>
          {props.productNumbers && Array.isArray(props.productNumbers) && props.productNumbers.length > 0 && (
            <div className="col-span-2">
              <span className="font-medium text-blue-800">
                Product Numbers:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {props.productNumbers.map((pn: any, idx: number) => (
                  <span
                    key={idx}
                    className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs"
                  >
                    {String(pn)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChunksList = (
    chunks: RelatedChunk[],
    title: string,
    bgColor: string
  ) => {
    if (chunks.length === 0) {
      return (
        <div className={`${bgColor} p-4 rounded-lg`}>
          <h3 className="text-lg font-medium mb-2">{title}</h3>
          <p className="text-gray-600">No chunks found</p>
        </div>
      );
    }

    return (
      <div className={`${bgColor} p-4 rounded-lg`}>
        <h3 className="text-lg font-medium mb-3">
          {title} ({chunks.length})
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {chunks.map((chunk) => (
            <div key={chunk.id} className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-500 mb-2">ID: {chunk.id}</div>
              {chunk.properties.content && (
                <div className="text-sm mb-2">
                  <span className="font-medium">Content:</span>
                  <div className="text-gray-700 mt-1 line-clamp-3">
                    {String(chunk.properties.content).substring(0, 200)}
                    {String(chunk.properties.content).length > 200 && "..."}
                  </div>
                </div>
              )}
              {chunk.properties.productNumbers && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {chunk.properties.productNumbers.map((pn, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs"
                    >
                      {pn}
                    </span>
                  ))}
                </div>
              )}
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Document Relationships
            </h2>
            <p className="text-sm text-gray-500 mt-1">ID: {documentId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {document && renderDocumentInfo(document)}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderChunksList(parentChunks, "Parent Chunks", "bg-green-50")}
            {renderChunksList(childChunks, "Child Chunks", "bg-yellow-50")}
          </div>
        </div>
      </div>
    </div>
  );
}
