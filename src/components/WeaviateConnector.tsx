"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ConnectionStore from "@/lib/connectionStore";

interface WeaviateConnectorProps {
  initialUrl: string;
}

export function WeaviateConnector({ initialUrl }: WeaviateConnectorProps) {
  const [url, setUrl] = useState(initialUrl);
  const [apiKey, setApiKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const router = useRouter();
  const connectionStore = ConnectionStore.getInstance();

  useEffect(() => {
    // Initialize API key from connection store
    setApiKey(connectionStore.apiKey || "");

    // Show API key field if it's required
    const tempStore = ConnectionStore.getInstance();
    tempStore.url = url;
    setShowApiKey(tempStore.isApiKeyRequired());
  }, [url, connectionStore]);

  // Extract host and port from URL
  const parseUrl = (
    fullUrl: string
  ): { host: string; port: number; grpcPort: number } => {
    try {
      const urlObj = new URL(fullUrl);
      return {
        host: urlObj.hostname,
        port: parseInt(urlObj.port || "8080"),
        grpcPort: 50051, // Default gRPC port
      };
    } catch {
      // If URL is invalid, return default values
      return { host: "127.0.0.1", port: 8080, grpcPort: 50051 };
    }
  };

  // Clear connection status when URL changes
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setConnectionStatus(null); // Clear the connection status message

    // Update API key visibility based on URL
    const tempStore = ConnectionStore.getInstance();
    tempStore.url = newUrl;
    setShowApiKey(tempStore.isApiKeyRequired());
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  // Handle click on the input field to select all text
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.select(); // Select all text when clicked
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      setErrorHint(null);

      // Format URL properly if needed
      let formattedUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        formattedUrl = `http://${url}`;
      }

      // Validate connection before attempting
      const tempStore = ConnectionStore.getInstance();
      tempStore.url = formattedUrl;
      tempStore.apiKey = apiKey;

      const validation = tempStore.validateConnection();
      if (!validation.isValid) {
        setError(validation.message || "Invalid connection configuration");
        return;
      }

      // Parse the URL to get host and port
      const { host, port, grpcPort } = parseUrl(formattedUrl);

      // Call API to update the connection
      const response = await fetch("/api/connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formattedUrl,
          apiKey: apiKey,
          host,
          port,
          grpcPort,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Store the error details and hint
        setError(
          result.details || result.error || "Failed to connect to Weaviate"
        );
        if (result.hint) {
          setErrorHint(result.hint);
        }
        return; // Exit early
      }

      // Show connection status message
      if (result.newConnection) {
        setConnectionStatus("Connected to a different Weaviate instance");
      } else {
        setConnectionStatus("Connected to the same Weaviate instance");
      }

      // Instead of just refreshing the page, we need to force a full reload
      // to ensure all components get the updated connection
      if (result.newConnection) {
        // Force a hard reload to clear any cached data
        window.location.reload();
      } else {
        // Just refresh the page for same instance connections
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to connect:", error);

      // Check if the error is from our API response
      if (error instanceof Error && error.message.includes("details")) {
        try {
          // Try to parse the error message as JSON
          const errorData = JSON.parse(
            error.message.substring(error.message.indexOf("{"))
          );
          setError(
            errorData.details ||
              errorData.error ||
              "Failed to connect to Weaviate"
          );
          setErrorHint(errorData.hint || null);
        } catch {
          // If parsing fails, just use the error message
          setError(error.message);
        }
      } else {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to connect to Weaviate"
        );
      }
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="mb-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm connection-settings">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Connection Settings
      </h3>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="weaviate-url"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Weaviate URL
            <span className="ml-1 text-xs text-gray-500">
              (
              {process.env.NODE_ENV === "development"
                ? "Development"
                : "Production"}{" "}
              mode)
            </span>
          </label>
          <input
            type="text"
            id="weaviate-url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={url}
            onChange={handleUrlChange}
            onClick={handleInputClick}
            placeholder="http://localhost:8080"
          />
          <p className="mt-1 text-xs text-gray-500">
            Examples: http://localhost:8080 (local),
            https://cluster.weaviate.network (cloud)
          </p>
        </div>

        {showApiKey && (
          <div>
            <label
              htmlFor="weaviate-api-key"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              API Key
              <span className="ml-1 text-xs text-red-500">
                (Required for production/cloud instances)
              </span>
            </label>
            <input
              type="password"
              id="weaviate-api-key"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="your-weaviate-api-key"
            />
            <p className="mt-1 text-xs text-gray-500">
              Get your API key from the Weaviate Cloud Console
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 font-medium transition-all duration-200"
          >
            {connecting ? "🔄 Connecting..." : "🔗 Connect"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
          {errorHint && (
            <div className="mt-1 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              <strong>Tip:</strong> {errorHint}
            </div>
          )}
        </div>
      )}

      {connectionStatus && !error && (
        <div className="mt-2 text-sm text-green-600">{connectionStatus}</div>
      )}
    </div>
  );
}
