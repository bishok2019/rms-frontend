import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Plus, Grid3x3 } from "lucide-react";
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
import type { DiningTable, Section } from "@/types/api";

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
  tableCode: table.tableNumber,
  area: sections.find((section) => section.id === table.section)?.name || "",
  capacity: table.seatingCapacity,
  isOccupied: table.isOccupied,
  canTakeMultipleOrder: table.canHaveMultipleOrders,
  remarks: table.specialRequests || "",
});

export default function TablesPage() {
  const [selectedTable, setSelectedTable] = useState<TableRecord | null>(null);
  const [selectedArea, setSelectedArea] = useState<Section | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAreaSheetOpen, setIsAreaSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"areas" | "tables">("areas");
  const [tableSearch, setTableSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [occupiedFilter, setOccupiedFilter] = useState<"all" | "occupied" | "vacant">(
    "all"
  );
  const { data: sectionsResponse } = useSections(activeTab === "areas");
  const { data: diningTablesResponse } = useDiningTables(activeTab === "tables");
  const { mutateAsync: createDiningTable } = useCreateDiningTable();
  const { mutateAsync: updateDiningTable } = useUpdateDiningTable();
  const areas = sectionsResponse?.data ?? [];
  const tables =
    diningTablesResponse?.data.map((table) => mapDiningTableToRecord(table, areas)) ??
    [];

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

  const handleDeleteTable = (_id: string) => {};

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
    <div className="p-4 md:p-6 space-y-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Tables & Areas</h1>
      </div>

      <div className="flex gap-2 border-b border-border">
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
      </div>

      {/* Areas Tab */}
      {activeTab === "areas" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Sheet open={isAreaSheetOpen} onOpenChange={setIsAreaSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  className="bg-accent text-accent-foreground w-full md:w-auto"
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
          </div>

          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {areas.map((area) => {
                  const count = tables.filter(
                    (table) => table.area === area.name
                  ).length;

                  return (
                    <div
                      key={area.id}
                      onDoubleClick={() => {
                        setAreaFilter(area.name);
                        setActiveTab("tables");
                      }}
                      className="rounded-lg border border-border bg-background/40 p-4 hover:bg-secondary/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Grid3x3 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{area.name}</h3>
                            <p className="text-xs text-primary mt-1">
                              {count} table{count === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
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
                      </div>
                    </div>
                  );
                })}
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
          <div className="flex justify-end">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-accent text-accent-foreground w-full md:w-auto"
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
          </div>

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
                    className="rounded-lg border border-border bg-background/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Grid3x3 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{table.tableCode}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{table.area}</p>
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
