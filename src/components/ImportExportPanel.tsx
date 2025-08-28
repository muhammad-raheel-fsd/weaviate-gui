"use client";

import { useState } from "react";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
} from "@heroicons/react/24/outline";

interface ImportExportPanelProps {
  collections: Array<{
    name: string;
    count: number;
    properties: Array<{
      name: string;
      dataType?: string[];
    }>;
  }>;
  onRefresh: () => void;
}

interface ImportResult {
  collection: string;
  totalObjects: number;
  imported: number;
  failed: number;
  errors: string[];
}

export function ImportExportPanel({
  collections,
  onRefresh,
}: ImportExportPanelProps) {
  const [activeTab, setActiveTab] = useState<"export" | "import" | "backup">(
    "export"
  );
  const [selectedCollection, setSelectedCollection] = useState("");
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [includeVectors, setIncludeVectors] = useState(false);
  const [exportLimit, setExportLimit] = useState(1000);

  // Import states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [createSchema, setCreateSchema] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Backup states
  const [backupId, setBackupId] = useState("");
  const [backupBackend, setBackupBackend] = useState<
    "filesystem" | "s3" | "gcs"
  >("filesystem");

  // Loading states
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleExport = async () => {
    if (!selectedCollection) {
      alert("Please select a collection to export");
      return;
    }

    setExporting(true);
    try {
      const params = new URLSearchParams({
        format: exportFormat,
        includeVectors: includeVectors.toString(),
        limit: exportLimit.toString(),
      });

      const response = await fetch(
        `/api/export/${selectedCollection}?${params}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${selectedCollection}_export.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert("Export completed successfully!");
    } catch (error) {
      console.error("Export error:", error);
      alert(
        `Export failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      alert("Please select a file to import");
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("createSchema", createSchema.toString());
      formData.append("replaceExisting", replaceExisting.toString());

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Import failed");
      }

      setImportResult(result.results);
      onRefresh(); // Refresh collections list
      alert("Import completed! Check the results below.");
    } catch (error) {
      console.error("Import error:", error);
      alert(
        `Import failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setImporting(false);
    }
  };

  const handleBackup = async () => {
    if (!backupId) {
      alert("Please enter a backup ID");
      return;
    }

    setBackingUp(true);
    try {
      const response = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backupId,
          backend: backupBackend,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Backup failed");
      }

      alert(`Backup created successfully! ID: ${backupId}`);
    } catch (error) {
      console.error("Backup error:", error);
      alert(
        `Backup failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async () => {
    if (!backupId) {
      alert("Please enter a backup ID");
      return;
    }

    if (
      !confirm(
        "This will restore data and may overwrite existing collections. Continue?"
      )
    ) {
      return;
    }

    setRestoring(true);
    try {
      const response = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backupId,
          backend: backupBackend,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Restore failed");
      }

      alert(`Restore completed successfully! ID: ${backupId}`);
      onRefresh(); // Refresh collections list
    } catch (error) {
      console.error("Restore error:", error);
      alert(
        `Restore failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 import-export-panel">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📦 Import & Export Data
      </h3>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: "export", label: "📤 Export", icon: ArrowDownTrayIcon },
          { id: "import", label: "📥 Import", icon: ArrowUpTrayIcon },
          { id: "backup", label: "💾 Backup/Restore", icon: CloudArrowUpIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Export Tab */}
      {activeTab === "export" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Collection
            </label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a collection...</option>
              {collections.map((collection) => (
                <option key={collection.name} value={collection.name}>
                  {collection.name} ({collection.count.toLocaleString()}{" "}
                  objects)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) =>
                  setExportFormat(e.target.value as "json" | "csv")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="json">JSON (with metadata)</option>
                <option value="csv">CSV (flat format)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Object Limit
              </label>
              <input
                type="number"
                value={exportLimit}
                onChange={(e) => setExportLimit(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="10000"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeVectors"
              checked={includeVectors}
              onChange={(e) => setIncludeVectors(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="includeVectors"
              className="ml-2 block text-sm text-gray-700"
            >
              Include vector embeddings (larger file size)
            </label>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || !selectedCollection}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 font-medium transition-all duration-200"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export Collection"}
          </button>
        </div>
      )}

      {/* Import Tab */}
      {activeTab === "import" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Upload a JSON file exported from this tool or compatible format
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="createSchema"
                checked={createSchema}
                onChange={(e) => setCreateSchema(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="createSchema"
                className="ml-2 block text-sm text-gray-700"
              >
                Create schema if collection doesn't exist
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="replaceExisting"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label
                htmlFor="replaceExisting"
                className="ml-2 block text-sm text-gray-700"
              >
                Replace existing collection (⚠️ destructive)
              </label>
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={importing || !importFile}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 font-medium transition-all duration-200"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            {importing ? "Importing..." : "Import Data"}
          </button>

          {/* Import Results */}
          {importResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Import Results</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Collection:</span>
                  <span className="ml-2 font-medium">
                    {importResult.collection}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Objects:</span>
                  <span className="ml-2 font-medium">
                    {importResult.totalObjects}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Imported:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {importResult.imported}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Failed:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {importResult.failed}
                  </span>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-3">
                  <span className="text-sm text-gray-600">Errors:</span>
                  <div className="mt-1 max-h-32 overflow-y-auto">
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <div
                        key={index}
                        className="text-xs text-red-600 bg-red-50 p-2 rounded mt-1"
                      >
                        {error}
                      </div>
                    ))}
                    {importResult.errors.length > 5 && (
                      <div className="text-xs text-gray-500 mt-1">
                        ... and {importResult.errors.length - 5} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === "backup" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backup ID
            </label>
            <input
              type="text"
              value={backupId}
              onChange={(e) => setBackupId(e.target.value)}
              placeholder="my-backup-2024"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Unique identifier for this backup
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backend Storage
            </label>
            <select
              value={backupBackend}
              onChange={(e) => setBackupBackend(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="filesystem">Local Filesystem</option>
              <option value="s3">Amazon S3</option>
              <option value="gcs">Google Cloud Storage</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleBackup}
              disabled={backingUp || !backupId}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 font-medium transition-all duration-200"
            >
              <CloudArrowUpIcon className="h-4 w-4" />
              {backingUp ? "Creating..." : "Create Backup"}
            </button>

            <button
              onClick={handleRestore}
              disabled={restoring || !backupId}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 font-medium transition-all duration-200"
            >
              <CloudArrowDownIcon className="h-4 w-4" />
              {restoring ? "Restoring..." : "Restore Backup"}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Backup Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Backups include all collections, schema, and data</li>
              <li>• Use filesystem backend for local development</li>
              <li>• Cloud backends require additional configuration</li>
              <li>• Restore will overwrite existing data</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
