"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PaginatedApiResponse, ApiResponse } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { privateApiInstance } from "@/Utils/ky";

interface ApiLog {
  id: number;
  url: string;
  osType: string;
  deviceType: string;
  method: string;
  ip: string;
  userAgent: string;
  systemDetails: object;
  userId: number | null;
  extraField: unknown;
  statusCode: string;
  createdAt: string;
  createdBy: number;
  username: string | null;
}

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
  const [logDetails, setLogDetails] = useState<string>("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    method: "",
    status_code: "",
    user_id: "",
    created_at: "",
  });
  const [page, setPage] = useState(1);

  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);



  const fetchLogs = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        search: search,
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== "")
        ),
      });
      const response = await privateApiInstance.get(`api-logs-app/list?${params}`);
      const data = await response.json() as PaginatedApiResponse<unknown>;
      console.log("API response:", data);
      setLogs(data.data || []);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [search, filtersString, filters]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const retrieveLog = async (id: number) => {
    try {
      const response = await privateApiInstance.get(`api-logs-app/retrieve/${id}`);
      const data = await response.json() as ApiResponse<unknown>;
      console.log("Retrieve response:", data);
      setLogDetails(JSON.stringify(data.data || data, null, 2));
      setSelectedLog(logs.find(log => log.id === id) || null);
    } catch (error) {
      console.error("Failed to retrieve log:", error);
    }
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 h-full overflow-hidden flex flex-col">
      <div className="sticky top-0 z-10 pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">API Logs</h1>
          <Button onClick={() => fetchLogs(1)} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          {/* <CardTitle>Logs</CardTitle> */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              value={filters.method}
              onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <Input
              placeholder="Status Code"
              value={filters.status_code}
              onChange={(e) => setFilters(prev => ({ ...prev, status_code: e.target.value }))}
            />
            <Input
              placeholder="User"
              value={filters.user_id}
              onChange={(e) => setFilters(prev => ({ ...prev, user_id: e.target.value }))}
            />
            <Input
              placeholder="Created At (YYYY-MM-DD)"
              value={filters.created_at}
              onChange={(e) => setFilters(prev => ({ ...prev, created_at: e.target.value }))}
              type="date"
            />
          </div>
        </CardHeader>
        <CardContent className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>OS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {logs.map((log) => (
                  <TableRow
                    key={log.id}
                    onDoubleClick={() => retrieveLog(log.id)}
                    className="cursor-pointer hover:bg-muted"
                  >
                    <TableCell className="font-mono">{log.method}</TableCell>
                    <TableCell className="font-mono text-sm">{log.url}</TableCell>
                    <TableCell>{log.statusCode}</TableCell>
                    <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{log.username || "N/A"}</TableCell>
                    <TableCell>{log.ip}</TableCell>
                    <TableCell>{log.osType}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1 || loading}
              variant="outline"
            >
              Previous
            </Button>
            <span>Page {page}</span>
            <Button
              onClick={() => fetchLogs(page + 1)}
              disabled={logs.length === 0 || loading}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected API log entry.
            </DialogDescription>
          </DialogHeader>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
            {logDetails}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}