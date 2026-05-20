"use client";

import { useCallback, useEffect, useState } from "react";
import type { PaginatedApiResponse, ApiResponse } from "@/types/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { ListPagination } from "@/components/common/ListPagination";

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

const PAGE_SIZE_OPTIONS = [10, 20, 40, 50];

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
  const [logDetails, setLogDetails] = useState<string>("");
  // const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [filters, setFilters] = useState({
    method: "",
    status_code: "",
    user_id: "",
    created_at: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    currentCount: 0,
    totalCount: 0,
    totalPages: 1,
  });

  const fetchLogs = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: pageSize.toString(),
        search: debouncedSearch,
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== "")
        ),
      });
      const response = await privateApiInstance.get(`api-logs-app/list?${params}`);
      const data = await response.json() as PaginatedApiResponse<ApiLog>;
      console.log("API response:", data);
      setLogs(data.data || []);
      setPage(pageNum);
      setPagination({
        currentCount: data.currentCount ?? data.data?.length ?? 0,
        totalCount: data.totalCount ?? data.data?.length ?? 0,
        totalPages: data.totalPages ?? 1,
      });
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      setLogs([]);
      setPagination({ currentCount: 0, totalCount: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, pageSize]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const retrieveLog = async (id: number) => {
    try {
      const response = await privateApiInstance.get(`api-logs-app/retrieve/${id}`);
      const data = await response.json() as ApiResponse<ApiLog>;
      console.log("Retrieve response:", data);
      setLogDetails(JSON.stringify(data.data || data, null, 2));
      setSelectedLog(logs.find(log => log.id === id) || null);
    } catch (error) {
      console.error("Failed to retrieve log:", error);
    }
  };

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden p-6">
      <div className="shrink-0 pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">API Logs</h1>
          <Button onClick={() => fetchLogs(1)} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="min-h-0 flex-1 border-none">
        <CardHeader className="shrink-0">
          {/* <CardTitle>Logs</CardTitle> */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
        <CardContent className="flex min-h-0 max-h-none flex-1 flex-col overflow-hidden">
          <Table containerClassName="min-h-0 flex-1 overflow-auto">
            <TableHeader className="sticky top-0 z-30 bg-background shadow-sm">
              <TableRow>
              {/* <TableRow className="bg-background hover:bg-background"> */}
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading logs...
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
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
                ))
              )}
            </TableBody>
          </Table>
          <ListPagination
            currentCount={pagination.currentCount}
            currentPage={page}
            isLoading={loading}
            onNextPage={() => fetchLogs(Math.min(page + 1, pagination.totalPages))}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
            onPreviousPage={() => fetchLogs(Math.max(page - 1, 1))}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            totalCount={pagination.totalCount}
            totalPages={pagination.totalPages}
          />
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
