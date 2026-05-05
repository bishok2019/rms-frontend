import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Plus, Grid3x3, Loader2, ChefHat, CheckCircle, XCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TableDetailModal } from "../components/table-detail-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import CreateArea from "./CreateArea";
import {
  useCreateDiningTable,
  useDiningTables,
  useSections,
  useUpdateDiningTable,
} from "../Store/TablesStore";
import { Input } from "@/components/ui/input";
import { ordersApi } from "@/services/orders";
import { successFunction, errorFunction } from "@/components/common/Alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DiningTable, Section, OrderItem } from "@/types/api";

interface TableRecord {
  id: string;
  tableCode: string;
  area: string;
  capacity: number;
  isOccupied: boolean;
  canTakeMultipleOrder: boolean;
  remarks?: string;
  qrCode?: string;
}

const mapDiningTableToRecord = (
  table: DiningTable,
  sections: Section[]
): TableRecord => ({
  id: String(table.id),
  tableCode: table.table_number,
  area: typeof table.section === 'string' ? table.section : sections.find((section) => section.id === table.section)?.name || "",
  capacity: table.capacity,
  isOccupied: table.is_occupied,
  canTakeMultipleOrder: table.can_take_multiple_orders,
  remarks: table.remarks || "",
  qrCode: table.qr_code,
});

export default function TablesPage() {
  const [selectedTable, setSelectedTable] = useState<TableRecord | null>(null);
  const [selectedArea, setSelectedArea] = useState<Section | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAreaSheetOpen, setIsAreaSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"areas" | "tables" | "order-items">("areas");
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [occupiedFilter, setOccupiedFilter] = useState<"all" | "occupied" | "vacant">(
    "all"
  );
  const [selectedTableForOrders, setSelectedTableForOrders] = useState<TableRecord | null>(null);
  const [tableOrderItems, setTableOrderItems] = useState<OrderItem[]>([]);
  const [editingQuantity, setEditingQuantity] = useState<{ id: number; quantity: number } | null>(null);
  const [isLoadingOrderItems, setIsLoadingOrderItems] = useState(false);
  const [orderItemFilters, setOrderItemFilters] = useState({
    status: "all",
    dietaryType: "all",
    spiceLevel: "all",
    orderType: "all",
    servingSize: "all",
  });
  const { data: sectionsResponse } = useSections(true); // Always load sections
  const { data: diningTablesResponse } = useDiningTables(activeTab === "tables" || activeTab === "order-items"); // Only load dining tables when needed
  const { mutateAsync: createDiningTable } = useCreateDiningTable();
  const { mutateAsync: updateDiningTable } = useUpdateDiningTable();
  const areas = sectionsResponse?.data ?? [];
  const tables =
    diningTablesResponse?.data.map((table) => mapDiningTableToRecord(table, areas)) ??
    [];

  // Set sectionsLoaded when sections are fetched
  useEffect(() => {
    if (sectionsResponse) {
      setSectionsLoaded(true);
    }
  }, [sectionsResponse]);

  const filteredTables = tables.filter((table) => {
    const matchesArea = areaFilter === "" || table.area === areaFilter;
    const matchesOccupied =
      occupiedFilter === "all" ||
      (occupiedFilter === "occupied" && table.isOccupied) ||
      (occupiedFilter === "vacant" && !table.isOccupied);
    const matchesSearch =
      tableSearch.trim().length === 0 ||
      table.tableCode.toLowerCase().includes(tableSearch.toLowerCase()) ||
      table.area.toLowerCase().includes(tableSearch.toLowerCase());
    return matchesArea && matchesOccupied && matchesSearch;
  });

  const handleEditTable = (table: TableRecord) => {
    setSelectedTable(table);
    setIsModalOpen(true);
  };

  const handleDeleteTable = (id: string) => {
    // TODO: Implement delete functionality
    console.log("Delete table:", id);
  };

  const handleTableClick = async (table: TableRecord) => {
    setSelectedTableForOrders(table);
    setActiveTab("order-items");
    // Reset filters to default when selecting a new table
    setOrderItemFilters({
      status: "all",
      dietaryType: "all",
      spiceLevel: "all",
      orderType: "all",
      servingSize: "all",
    });
    await fetchTableOrderItems(table.id);
  };

  const handleEditQuantity = (item: OrderItem) => {
    setEditingQuantity({ id: item.id, quantity: item.quantity });
  };

  const handleSaveQuantity = async () => {
    if (!editingQuantity) return;

    try {
      await ordersApi.updateOrderItem(editingQuantity.id, { quantity: editingQuantity.quantity });
      // Update local state
      setTableOrderItems(prev =>
        prev.map(item =>
          item.id === editingQuantity.id
            ? { ...item, quantity: editingQuantity.quantity }
            : item
        )
      );
      setEditingQuantity(null);
      successFunction("Quantity updated successfully.");
    } catch (error) {
      errorFunction("Failed to update quantity.");
    }
  };

  const handleCancelEdit = () => {
    setEditingQuantity(null);
  };

  const fetchTableOrderItems = async (tableNumber?: string) => {
    try {
      setIsLoadingOrderItems(true);
      const params: Parameters<typeof ordersApi.getOrderItemsList>[0] = {
        page_size: 100,
      };

      if (tableNumber) {
        params.order__dining_table = tableNumber;
      }

      // Add filters
      if (orderItemFilters.status !== "all") params.status = orderItemFilters.status;
      if (orderItemFilters.dietaryType !== "all") params.dietary_type = orderItemFilters.dietaryType;
      if (orderItemFilters.spiceLevel !== "all") params.spice_level = orderItemFilters.spiceLevel;
      if (orderItemFilters.orderType !== "all") params.order_type = orderItemFilters.orderType;
      if (orderItemFilters.servingSize !== "all") params.serving_size = orderItemFilters.servingSize;

      const response = await ordersApi.getOrderItemsList(params);

      if (response.success && response.data) {
        setTableOrderItems(response.data);
      } else {
        setTableOrderItems([]);
      }
    } catch (error) {
      console.error("Error fetching table order items:", error);
      setTableOrderItems([]);
    } finally {
      setIsLoadingOrderItems(false);
    }
  };

  const handleSaveTable = async (table: TableRecord) => {
    const selectedSection = areas.find((area) => area.name === table.area);
    const payload = {
      tableNumber: table.tableCode,
      seatingCapacity: table.capacity,
      section: selectedSection?.id ?? null,
      specialRequests: table.remarks || "",
      canHaveMultipleOrders: table.canTakeMultipleOrder,
      isOccupied: false,
    };

    if (selectedTable) {
      await updateDiningTable({
        id: Number(selectedTable.id),
        data: payload,
      });
    } else {
      await createDiningTable(payload);
    }

    setIsModalOpen(false);
    setSelectedTable(null);
  };
  return (
    <div className="p-4 md:p-6 space-y-6 h-full overflow-hidden flex flex-col">
      <div className="sticky top-0 z-10 pb-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Tables & Areas</h1>
      </div>

      <div className="flex gap-2 border-b border-border justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("areas")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "areas"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Areas
          </button>
          <button
            onClick={() => setActiveTab("tables")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "tables"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tables
          </button>
          {selectedTableForOrders && (
            <button
              onClick={() => setActiveTab("order-items")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "order-items"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ChefHat className="w-4 h-4 mr-1 inline" />
              Table {selectedTableForOrders.tableCode} Orders
            </button>
          )}
        </div>

        {/* Add button aligned with tabs */}
        <div className="flex">
          {activeTab === "areas" && (
            <Sheet open={isAreaSheetOpen} onOpenChange={setIsAreaSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={() => {
                    setSelectedArea(null);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Area
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{selectedArea ? "Edit Area" : "New Area"}</SheetTitle>
                  <SheetDescription>
                    {selectedArea
                      ? "Update the area details and save your changes."
                      : "Create a new area. Click save when you're done."}
                  </SheetDescription>
                </SheetHeader>
                <CreateArea
                  edit={Boolean(selectedArea)}
                  data={selectedArea}
                  onSuccess={() => {
                    setIsAreaSheetOpen(false);
                    setSelectedArea(null);
                  }}
                />
              </SheetContent>
            </Sheet>
          )}

          {activeTab === "tables" && (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={() => {
                    setSelectedTable(null);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Table
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full sm:max-w-lg bg-card border-border">
                <DialogHeader>
                  <DialogTitle>
                    {selectedTable ? "Edit Table" : "Add New Table"}
                  </DialogTitle>
                </DialogHeader>
                <TableDetailModal
                  open={isModalOpen}
                  onOpenChange={setIsModalOpen}
                  table={selectedTable}
                  areas={areas}
                  onSave={handleSaveTable}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Areas Tab */}
      {activeTab === "areas" && (
        <div className="space-y-4">

          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="pt-6 min-h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {areas.map((area) => (
                  <div
                    key={area.id}
                    onClick={() => {
                      setAreaFilter(area.name);
                      setActiveTab("tables");
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAreaFilter(area.name);
                      setActiveTab("tables");
                    }}
                    className="rounded-lg border border-border bg-background/40 p-4 hover:bg-secondary/40 transition-colors cursor-pointer min-h-[120px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Grid3x3 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{area.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {area.description}
                          </p>
                          <p className="text-xs text-primary mt-1">
                            Total: {area.totalTables} table{parseInt(area.totalTables) === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedArea(area);
                              setIsAreaSheetOpen(true);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{area.tablesAvailable}</span>
                          <XCircle className="w-4 h-4 text-red-500 ml-2" />
                          <span>{area.tablesOccupied}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {areas.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No areas found. Create one to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tables Tab */}
      {activeTab === "tables" && (
        <div className="space-y-4">

          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search by table code or area"
                    className="md:col-span-2"
                  />
                  <select
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="">All Areas</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.name}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={occupiedFilter}
                    onChange={(e) =>
                      setOccupiedFilter(
                        e.target.value as "all" | "occupied" | "vacant"
                      )
                    }
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="occupied">Occupied</option>
                    <option value="vacant">Vacant</option>
                  </select>
                </div>
                {areaFilter && (
                  <div className="flex items-center justify-between bg-primary/10 px-3 py-2 rounded-md">
                    <span className="text-sm text-foreground">
                      Filtered by area: <span className="font-semibold">{areaFilter}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAreaFilter("")}
                      className="text-xs h-auto px-2 py-1"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Tables</h3>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredTables.length} table{filteredTables.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTables.map((table) => (
                  <div
                    key={table.id}
                    className="rounded-lg border border-border bg-background/40 p-4 cursor-pointer hover:bg-secondary/40 transition-colors"
                    onClick={() => handleTableClick(table)}
                    title="Click to view order items"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Grid3x3 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${table.isOccupied ? 'bg-red-500' : 'bg-green-500'}`}></div>
                          <div>
                            <h4 className="font-semibold">T{table.tableCode} - {table.area}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {table.isOccupied ? 'Occupied' : 'Available'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTable(table)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTable(table.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className="font-semibold">{table.capacity} Seats</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Multiple Order</span>
                        <span className="font-semibold">
                          {table.canTakeMultipleOrder ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>

                    {table.remarks && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2 min-h-9">
                        {table.remarks}
                      </p>
                    )}
                  </div>
                ))}

                {filteredTables.length === 0 && (
                  <div className="col-span-full rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    {tableSearch ? "No tables match your search." : "No tables found. Create one to get started."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order Items Tab */}
      {activeTab === "order-items" && (
        <div className="space-y-4">
          <Card className="bg-card border-none">

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tableFilter">Table</Label>
                  <Select
                    value={selectedTableForOrders ? selectedTableForOrders.id : "all"}
                    onValueChange={(value) => {
                      if (value === "all") {
                        setSelectedTableForOrders(null);
                        fetchTableOrderItems();
                      } else {
                        const table = tables.find(t => t.id === value);
                        if (table) {
                          setSelectedTableForOrders(table);
                          fetchTableOrderItems(table.id);
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Table" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tables</SelectItem>
                      {tables.map((table) => (
                        <SelectItem key={table.id} value={table.id}>
                          T{table.tableCode} - {table.area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statusFilter">Status</Label>
                  <Select
                    value={orderItemFilters.status}
                    onValueChange={(value) => {
                      setOrderItemFilters(prev => ({ ...prev, status: value }));
                      fetchTableOrderItems(selectedTableForOrders.id);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="served">Served</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dietaryFilter">Dietary Type</Label>
                  <Select
                    value={orderItemFilters.dietaryType}
                    onValueChange={(value) => {
                      setOrderItemFilters(prev => ({ ...prev, dietaryType: value }));
                      fetchTableOrderItems(selectedTableForOrders.id);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="veg">🥬 Veg</SelectItem>
                      <SelectItem value="non_veg">🍖 Non-Veg</SelectItem>
                      <SelectItem value="vegan">🌱 Vegan</SelectItem>
                      <SelectItem value="gluten_free">🌾 Gluten-Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spiceFilter">Spice Level</Label>
                  <Select
                    value={orderItemFilters.spiceLevel}
                    onValueChange={(value) => {
                      setOrderItemFilters(prev => ({ ...prev, spiceLevel: value }));
                      fetchTableOrderItems(selectedTableForOrders.id);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hot">Hot</SelectItem>
                      <SelectItem value="extra_hot">Extra Hot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderTypeFilter">Order Type</Label>
                  <Select
                    value={orderItemFilters.orderType}
                    onValueChange={(value) => {
                      setOrderItemFilters(prev => ({ ...prev, orderType: value }));
                      fetchTableOrderItems(selectedTableForOrders.id);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="dine_in">Dine In</SelectItem>
                      <SelectItem value="takeaway">Takeaway</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servingFilter">Serving Size</Label>
                  <Select
                    value={orderItemFilters.servingSize}
                    onValueChange={(value) => {
                      setOrderItemFilters(prev => ({ ...prev, servingSize: value }));
                      fetchTableOrderItems(selectedTableForOrders.id);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sizes</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="extra_large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Actions</Label>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTableForOrders(null);
                      setOrderItemFilters({
                        status: "all",
                        dietaryType: "all",
                        spiceLevel: "all",
                        orderType: "all",
                        servingSize: "all",
                      });
                      fetchTableOrderItems();
                    }}
                    className="text-muted-foreground w-full"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-none overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                {selectedTableForOrders ? `Order Items for Table ${selectedTableForOrders.tableCode}` : "All Order Items"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Clicked table to view all order items assigned to this table. Click on quantities to edit them.
              </p>
             </CardHeader>
             <CardContent className="max-h-[600px] overflow-y-auto">
               {isLoadingOrderItems ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading order items...</span>
                </div>
              ) : tableOrderItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No order items found for this table</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-foreground">Order #</TableHead>
                        <TableHead className="text-foreground">Item</TableHead>
                        <TableHead className="text-foreground">Quantity <span className="text-xs text-muted-foreground">(click to edit)</span></TableHead>
                        <TableHead className="text-foreground">Status</TableHead>
                        <TableHead className="text-foreground">Dietary Type</TableHead>
                        <TableHead className="text-foreground">Prepared At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableOrderItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-secondary/50">
                          <TableCell className="font-medium">#{item.order}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.orderItem ? (typeof item.orderItem === "object" ? item.orderItem.name : item.orderItem) : "Unknown Item"}
                          </TableCell>
                           <TableCell>
                             {editingQuantity?.id === item.id ? (
                               <div className="flex items-center gap-2">
                                   <Input
                                     type="number"
                                     step="0.1"
                                     min="0.1"
                                     value={editingQuantity.quantity.toFixed(2)}
                                    onChange={(e) => setEditingQuantity(prev => prev ? { ...prev, quantity: parseFloat(e.target.value) || 0.1 } : null)}
                                    className="w-20 h-8"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveQuantity();
                                      if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                  />
                                 <Button size="sm" onClick={handleSaveQuantity} className="h-8 px-2">
                                   Save
                                 </Button>
                                 <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8 px-2">
                                   Cancel
                                 </Button>
                               </div>
                             ) : (
                                <div className="flex items-center gap-2">
                                  <span
                                    className="cursor-pointer hover:underline hover:text-primary"
                                    onClick={() => handleEditQuantity(item)}
                                    title="Click to edit quantity"
                                  >
                                    {(Number(item.quantity) || 0).toFixed(2)}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditQuantity(item)}
                                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                    title="Edit quantity"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                             )}
                           </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.status === "preparing"
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                : item.status === "ready"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : item.status === "served"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            }`}>
                              {item.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.dietaryType === "veg" && "🥬 Veg"}
                            {item.dietaryType === "non_veg" && "🍖 Non-Veg"}
                            {item.dietaryType === "vegan" && "🌱 Vegan"}
                            {item.dietaryType === "gluten_free" && "🌾 Gluten-Free"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.preparedAt ? new Date(item.preparedAt).toLocaleString() : "Not started"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table Detail Modal - Hidden, only used internally */}
      {activeTab === "tables" && (
        <TableDetailModal
          open={false}
          onOpenChange={setIsModalOpen}
          table={selectedTable}
          areas={areas}
          onSave={handleSaveTable}
        />
      )}
    </div>
  );
}
