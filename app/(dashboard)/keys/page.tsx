"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  Eye,
  EyeOff,
  ClipboardCopy,
  Check,
  Loader2,
  Info,
} from "lucide-react";
import {
  addApiKey,
  getAllApiKeys,
  toggleApiKeyStatus,
  deleteApiKey,
  recoverUnhealthyKeys,
} from "@/lib/api-keys";
import type { ApiKey } from "@/lib/api-keys";

export default function KeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ apiKey: "" });
  const [filter, setFilter] = useState("");
  const [rowPending, setRowPending] = useState<Record<number, boolean>>({});
  const [showKeyIds, setShowKeyIds] = useState<Set<number>>(new Set());
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    setLoading(true);
    try {
      const keys = await getAllApiKeys();
      setApiKeys(keys);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.apiKey.trim()) return;

    setSubmitting(true);
    try {
      const result = await addApiKey(formData.apiKey.trim());
      if (result.success) {
        setFormData({ apiKey: "" });
        await loadApiKeys();
        setIsDialogOpen(false);
      } else {
        alert(result.error || "Failed to add API key");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    setRowPending((p) => ({ ...p, [id]: true }));
    try {
      await toggleApiKeyStatus(id, !currentStatus);
      await loadApiKeys();
    } finally {
      setRowPending((p) => {
        const { [id]: _, ...rest } = p;
        return rest;
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;
    setRowPending((p) => ({ ...p, [id]: true }));
    try {
      await deleteApiKey(id);
      await loadApiKeys();
    } finally {
      setRowPending((p) => {
        const { [id]: _, ...rest } = p;
        return rest;
      });
    }
  };

  const handleRecoverUnhealthy = async () => {
    setSubmitting(true);
    try {
      await recoverUnhealthyKeys();
      await loadApiKeys();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnableAll = async () => {
    setSubmitting(true);
    try {
      for (const k of apiKeys) {
        if (!k.isActive) await toggleApiKeyStatus(k.id, true);
      }
      await loadApiKeys();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisableAll = async () => {
    setSubmitting(true);
    try {
      for (const k of apiKeys) {
        if (k.isActive) await toggleApiKeyStatus(k.id, false);
      }
      await loadApiKeys();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleShowKey = (id: number) => {
    setShowKeyIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyKey = async (id: number, key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKeyId(id);
      setTimeout(() => setCopiedKeyId(null), 1500);
    } catch {
      alert("Failed to copy");
    }
  };

  const formatTimestamp = (timestamp: number | null) =>
    timestamp ? new Date(timestamp).toLocaleString() : "Never";

  const getStatusBadge = (isActive: boolean, isHealthy: boolean) => {
    if (!isActive)
      return (
        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
          Disabled
        </span>
      );
    if (!isHealthy)
      return (
        <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600">
          Unhealthy
        </span>
      );
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-600">
        Active
      </span>
    );
  };

  // Stats (useMemo to avoid unnecessary recomputation)
  const stats = useMemo(() => {
    const total = apiKeys.length;
    const active = apiKeys.filter((k) => k.isActive && k.isHealthy).length;
    const disabled = apiKeys.filter((k) => !k.isActive).length;
    const unhealthy = apiKeys.filter((k) => k.isActive && !k.isHealthy).length;
    return { total, active, disabled, unhealthy };
  }, [apiKeys]);

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">API Key Management</h1>
        <p className="text-muted-foreground text-sm">
          Manage your Gemini API keys for load balancing and monitoring
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={loadApiKeys} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleRecoverUnhealthy}
            disabled={submitting}
          >
            Recover Unhealthy
          </Button>

          <Button
            variant="outline"
            onClick={handleEnableAll}
            disabled={submitting}
          >
            Enable All
          </Button>

          <Button
            variant="outline"
            onClick={handleDisableAll}
            disabled={submitting}
          >
            Disable All
          </Button>
        </div>

        {/* Add Key */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add API Key</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Add New API Key</DialogTitle>
              <DialogDescription>
                Enter your Gemini API key to add it to the load balancing pool
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddKey} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Adding..." : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Button
          variant="secondary"
          className="w-fit flex items-center gap-2"
          title={`Active: ${stats.active}, Disabled: ${stats.disabled}, Unhealthy: ${stats.unhealthy}, Total: ${stats.total}`}
        >
          <Info className="h-4 w-4 text-muted-foreground" />
          <span>
            Showing {stats.total} keys — Active: {stats.active}, Disabled:{" "}
            {stats.disabled}, Unhealthy: {stats.unhealthy}
          </span>
        </Button>

        <Input
          className="w-64"
          placeholder="Search by key or ID..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* API Key List (keep original logic) */}
      {/* ...Code below remains unchanged... */}

      {/* API Key List */}
      <div className="border rounded-md divide-y text-sm">
        {loading ? (
          <div className="text-center py-6 text-muted-foreground">
            Loading API keys...
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No API keys configured yet.
          </div>
        ) : (
          apiKeys
            .filter((k) => {
              const t = filter.trim().toLowerCase();
              if (!t) return true;
              const preview =
                `${k.apiKey.substring(0, 8)}...${k.apiKey.substring(
                  k.apiKey.length - 4,
                )}`.toLowerCase();
              return String(k.id).includes(t) || preview.includes(t);
            })
            .map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="font-medium truncate w-16">#{key.id}</span>
                  {getStatusBadge(key.isActive, key.isHealthy)}
                  <span className="truncate w-40">
                    {showKeyIds.has(key.id)
                      ? key.apiKey
                      : `${key.apiKey.substring(0, 8)}...${key.apiKey.substring(
                          key.apiKey.length - 4,
                        )}`}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleShowKey(key.id)}
                  >
                    {showKeyIds.has(key.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyKey(key.id, key.apiKey)}
                  >
                    {copiedKeyId === key.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <ClipboardCopy className="h-4 w-4" />
                    )}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(key.lastUsedAt)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Failures: {key.failureCount}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(key.id, key.isActive)}
                    disabled={rowPending[key.id] || submitting}
                  >
                    {rowPending[key.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : key.isActive ? (
                      "Disable"
                    ) : (
                      "Enable"
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(key.id)}
                    disabled={rowPending[key.id] || submitting}
                  >
                    {rowPending[key.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
