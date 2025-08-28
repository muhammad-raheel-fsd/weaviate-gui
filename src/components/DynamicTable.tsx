import React from "react";

export type ColumnDef = {
  key: string;
  label: string;
  dataType?: string[];
  render?: (value: unknown) => React.ReactNode;
};

type TableData = Record<string, unknown> & {
  _additional?: {
    id: string;
  };
};

type DynamicTableProps = {
  columns: ColumnDef[];
  data: TableData[];
  loading?: boolean;
  error?: string;
  onSort?: (columnKey: string) => void;
  sortConfig?: {
    key: string;
    direction: "asc" | "desc";
  } | null;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  onViewEmbeddings?: (id: string) => void;
  onViewRelationships?: (id: string) => void;
  className?: string;
};

export const DynamicTable: React.FC<DynamicTableProps> = ({
  columns,
  data,
  loading = false,
  error,
  onSort,
  sortConfig,
  selectionMode = false,
  selectedIds = new Set(),
  onSelect,
  onViewEmbeddings,
  onViewRelationships,
  className,
}) => {
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const getSortIcon = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.dataType?.includes("date")) {
      return null;
    }

    if (sortConfig?.key !== columnKey) {
      return <span className="ml-1 text-gray-400">↓</span>; // Show descending arrow as default
    }
    return sortConfig.direction === "asc" ? (
      <span className="ml-1">↑</span>
    ) : (
      <span className="ml-1">↓</span>
    );
  };

  const truncateText = (
    text: string,
    wordLimit: number = 3,
    charLimit: number = 40
  ): { truncated: string; isTruncated: boolean } => {
    // First check character limit
    if (text.length > charLimit) {
      return {
        truncated: text.substring(0, charLimit) + "...",
        isTruncated: true,
      };
    }

    // Then check word limit
    const words = text.split(" ");
    if (words.length <= wordLimit) {
      return { truncated: text, isTruncated: false };
    }
    return {
      truncated: words.slice(0, wordLimit).join(" ") + "...",
      isTruncated: true,
    };
  };

  const renderCell = (row: TableData, column: ColumnDef) => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value);
    }
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }

    let displayValue: string;
    if (typeof value === "object") {
      displayValue = Array.isArray(value)
        ? value.join(", ")
        : JSON.stringify(value);
    } else {
      displayValue = String(value);
    }

    const { truncated, isTruncated } = truncateText(displayValue);

    if (isTruncated) {
      return (
        <div className="group relative">
          <span className="cursor-help text-blue-600 hover:text-blue-800 transition-colors duration-200">
            {truncated}
          </span>
          <div className="invisible group-hover:visible absolute z-20 bottom-full left-0 mb-2 p-4 bg-gray-900 text-white text-sm rounded-xl shadow-xl max-w-sm break-words border border-gray-700">
            <div className="font-medium text-gray-200 mb-1">Full Content:</div>
            <div className="text-gray-100">{displayValue}</div>
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      );
    }

    return <span>{displayValue}</span>;
  };

  return (
    <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            {selectionMode && (
              <th scope="col" className="relative px-6 py-3 w-0">
                <span className="sr-only">Select</span>
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-6 py-4 text-left group relative border-b-2 border-gray-200 ${
                  column.dataType?.includes("date")
                    ? "cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                    : ""
                }`}
                title={column.dataType ? column.dataType.join(", ") : "unknown"}
                onClick={() => onSort?.(column.key)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                      {column.label}
                    </span>
                    <span className="text-xs text-gray-600 font-medium mt-1">
                      {column.dataType
                        ? column.dataType.join(" | ")
                        : "unknown"}
                    </span>
                  </div>
                  {getSortIcon(column.key)}
                </div>
              </th>
            ))}
            {(onViewEmbeddings || onViewRelationships) && (
              <th
                scope="col"
                className="relative px-6 py-4 border-b-2 border-gray-200"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                    Actions
                  </span>
                  <span className="text-xs text-gray-600 font-medium mt-1">
                    operations
                  </span>
                </div>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr
              key={row._additional?.id || rowIndex}
              className="hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100"
            >
              {selectionMode && (
                <td className="relative w-0 px-6 py-4">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={
                      row._additional?.id
                        ? selectedIds.has(row._additional.id)
                        : false
                    }
                    onChange={() =>
                      row._additional?.id && onSelect?.(row._additional.id)
                    }
                  />
                </td>
              )}
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-6 py-4 text-sm text-gray-700 font-medium"
                >
                  <div className="max-w-xs">{renderCell(row, column)}</div>
                </td>
              ))}
              {(onViewEmbeddings || onViewRelationships) && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex gap-2 justify-end">
                    {onViewEmbeddings && (
                      <button
                        onClick={() =>
                          row._additional?.id &&
                          onViewEmbeddings(row._additional.id)
                        }
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
                        disabled={!row._additional?.id}
                      >
                        ✨ Embeddings
                      </button>
                    )}
                    {onViewRelationships && className === "Documents" && (
                      <button
                        onClick={() =>
                          row._additional?.id &&
                          onViewRelationships(row._additional.id)
                        }
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md"
                        disabled={!row._additional?.id}
                      >
                        🔗 Relations
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
