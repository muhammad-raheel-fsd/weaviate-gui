"use client";

import { useState, useEffect } from "react";

interface TenantSelectorProps {
  collection: string;
  onTenantChange: (tenant: string | null) => void;
  initialTenant?: string | null;
}

interface TenantsResponse {
  tenants: string[];
  isMultiTenant: boolean;
  total?: number;
}

export function TenantSelector({
  collection,
  onTenantChange,
  initialTenant = null,
}: TenantSelectorProps) {
  const [tenants, setTenants] = useState<string[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(
    initialTenant
  );
  const [isMultiTenant, setIsMultiTenant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTenants() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/tenants/${collection}`);
        const data: TenantsResponse = await res.json();

        setTenants(data.tenants || []);
        setIsMultiTenant(data.isMultiTenant);

        // Auto-select first tenant if multi-tenant and no tenant selected
        if (data.isMultiTenant && data.tenants.length > 0 && !selectedTenant) {
          const firstTenant = data.tenants[0];
          setSelectedTenant(firstTenant);
          onTenantChange(firstTenant);
        }
      } catch (err) {
        console.error("Failed to fetch tenants:", err);
        setError(err instanceof Error ? err.message : "Failed to load tenants");
      } finally {
        setLoading(false);
      }
    }

    fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection]);

  // Not a multi-tenant collection - don't show selector
  if (!isMultiTenant) {
    return null;
  }

  if (loading) {
    return (
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-gray-500">Loading tenants...</span>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 text-sm text-red-600">
        Failed to load tenants: {error}
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="mb-4 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
        No active tenants found for this collection
      </div>
    );
  }

  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTenant = e.target.value;
    setSelectedTenant(newTenant);
    onTenantChange(newTenant);
  };

  return (
    <div className="mb-4 flex items-center gap-3">
      <label
        htmlFor="tenant-selector"
        className="text-sm font-medium text-gray-700"
      >
        Tenant:
      </label>
      <select
        id="tenant-selector"
        value={selectedTenant || ""}
        onChange={handleTenantChange}
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
      >
        {tenants.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <span className="text-xs text-gray-500">
        ({tenants.length} tenant{tenants.length !== 1 ? "s" : ""})
      </span>
    </div>
  );
}
