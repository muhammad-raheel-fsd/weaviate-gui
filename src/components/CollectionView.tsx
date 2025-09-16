"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DynamicTable, ColumnDef } from "@/components/DynamicTable";
import { CollectionData } from "@/lib/weaviate";
import { DeleteObjectsModal } from "@/components/DeleteObjectsModal";
import { EmbeddingsView } from "@/components/EmbeddingsView";
import { DocumentRelationshipView } from "@/components/DocumentRelationshipView";
import { SearchBar } from "@/components/SearchBar";

interface CollectionViewProps {
  collectionName: string;
  properties: Array<{
    name: string;
    dataType: string[];
    description?: string;
  }>;
}

export function CollectionView({
  collectionName,
  properties,
}: CollectionViewProps) {
  const [data, setData] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    property: string;
    order: "asc" | "desc";
  } | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [embeddingsViewOpen, setEmbeddingsViewOpen] = useState(false);
  const [relationshipViewOpen, setRelationshipViewOpen] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CollectionData[]>([]);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const OBJECTS_PER_PAGE = 250;

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchData = useCallback(
    async (loadMore = false) => {
      if (!loadMore) {
        setLoading(true);
        setData([]);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      try {
        const currentOffset = loadMore ? offset : 0;
        const url = new URL(
          `/api/collection/${collectionName}`,
          window.location.origin
        );
        if (sortConfig) {
          url.searchParams.set("sortProperty", sortConfig.property);
          url.searchParams.set("sortOrder", sortConfig.order);
        }
        url.searchParams.set("limit", String(OBJECTS_PER_PAGE));
        url.searchParams.set("offset", String(currentOffset));

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.details || result.error || "Failed to fetch data"
          );
        }

        const newData = result.data || [];

        setData((prevData) => (loadMore ? [...prevData, ...newData] : newData));
        setOffset(currentOffset + newData.length);
        setCanLoadMore(newData.length === OBJECTS_PER_PAGE);
        setError(null);
      } catch (err) {
        console.error("Error in CollectionView:", {
          collectionName,
          error:
            err instanceof Error
              ? {
                  name: err.name,
                  message: err.message,
                  cause: err.cause,
                  stack: err.stack,
                }
              : err,
        });
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [collectionName, sortConfig, offset]
  );

  useEffect(() => {
    fetchData(false);
  }, [sortConfig]);

  const handleLoadMore = () => {
    fetchData(true);
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteClick = () => {
    if (selectionMode) {
      if (selectedIds.size > 0) {
        setDeleteModalOpen(true);
      } else {
        // Exit selection mode if no items are selected
        setSelectionMode(false);
      }
    } else {
      setSelectionMode(true);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/collection/${collectionName}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          objectIds: Array.from(selectedIds),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.details || error.error || "Failed to delete objects"
        );
      }
      setDeleteModalOpen(false);
      setSelectionMode(false);
      setSelectedIds(new Set());
      await fetchData();
    } catch (err) {
      console.error("Error deleting objects:", err);
      setError(err instanceof Error ? err.message : "Failed to delete objects");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleViewEmbeddings = (objectId: string) => {
    setSelectedObjectId(objectId);
    setEmbeddingsViewOpen(true);
  };

  const handleCloseEmbeddings = () => {
    setEmbeddingsViewOpen(false);
    setSelectedObjectId(null);
  };

  const handleViewRelationships = (objectId: string) => {
    setSelectedObjectId(objectId);
    setRelationshipViewOpen(true);
  };

  const handleCloseRelationships = () => {
    setRelationshipViewOpen(false);
    setSelectedObjectId(null);
  };

  const handleSearch = useCallback(
    async (query: string) => {
      try {
        setIsSearching(true);
        setSearchQuery(query);

        const response = await fetch(
          `/api/search/${collectionName}?query=${encodeURIComponent(
            query
          )}&limit=100`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Search failed");
        }

        setSearchResults(result.data || []);
      } catch (err) {
        console.error("Search error:", err);
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setIsSearching(false);
      }
    },
    [collectionName]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
        role="alert"
      >
        <p>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const columns: ColumnDef[] = properties.map((prop) => ({
    key: prop.name,
    label: prop.name,
    dataType: prop.dataType,
    // Remove custom render - let DynamicTable handle object rendering
  }));

  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.dataType?.includes("date")) return;

    setSortConfig((current) => {
      if (current?.property === columnKey) {
        if (current.order === "desc") {
          return { property: columnKey, order: "asc" };
        }
        return null;
      }
      return { property: columnKey, order: "desc" }; // First click sorts descending
    });
  };

  // Use search results if searching, otherwise use regular data
  const displayData = searchQuery ? searchResults : data;
  const isShowingSearchResults = searchQuery && searchResults.length > 0;

  return (
    <div>
      <div ref={topRef}>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {collectionName}
                {isShowingSearchResults && (
                  <span className="ml-2 text-sm font-normal text-blue-600">
                    ({searchResults.length} search results)
                  </span>
                )}
              </h2>
            </div>
            <SearchBar
              onSearch={handleSearch}
              onClear={handleClearSearch}
              placeholder={`Search in ${collectionName}...`}
              loading={isSearching}
            />
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-3">
            <button
              onClick={handleDeleteClick}
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectionMode && selectedIds.size > 0
                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md"
                  : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
              }`}
            >
              {selectionMode ? "🗑️ Delete Selected" : "🗑️ Delete Mode"}
            </button>
            {selectionMode && (
              <button
                onClick={handleCancelSelection}
                className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-all duration-200"
              >
                ❌ Cancel
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={scrollToBottom}
              className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-all duration-200"
            >
              ⬇️ Bottom
            </button>
          </div>
        </div>
      </div>

      <DynamicTable
        data={displayData}
        columns={columns}
        onSort={handleSort}
        sortConfig={
          sortConfig
            ? {
                key: sortConfig.property,
                direction: sortConfig.order,
              }
            : null
        }
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onViewEmbeddings={handleViewEmbeddings}
        onViewRelationships={handleViewRelationships}
        className={collectionName}
      />

      {canLoadMore && !searchQuery && (
        <div
          ref={bottomRef}
          className="mt-4 flex justify-center items-center gap-4"
        >
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-400 transition-all duration-200"
          >
            {loadingMore ? "⏳ Loading..." : "📄 Load More"}
          </button>
          <button
            onClick={scrollToTop}
            className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-all duration-200"
          >
            ⬆️ Top
          </button>
        </div>
      )}

      <DeleteObjectsModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDelete={handleDeleteConfirm}
        selectedCount={selectedIds.size}
      />

      {embeddingsViewOpen && selectedObjectId && (
        <EmbeddingsView
          objectId={selectedObjectId}
          className={collectionName}
          onClose={handleCloseEmbeddings}
        />
      )}

      {relationshipViewOpen && selectedObjectId && (
        <DocumentRelationshipView
          documentId={selectedObjectId}
          onClose={handleCloseRelationships}
        />
      )}
    </div>
  );
}
