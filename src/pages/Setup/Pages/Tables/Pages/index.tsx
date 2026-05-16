import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Check, Cross, Edit, Grid3X3, List, Minus, Plus, Search, Table2, Trash2, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { errorFunction } from "@/components/common/Alert";
import { cn } from "@/lib/utils";
import type { DiningTable, Section } from "@/types/api";
import { TableDetailModal } from "../components/table-detail-modal";
import CreateArea from "./CreateArea";
import {
  useCreateDiningTable,
  useDiningTables,
  useSections,
  useUpdateDiningTable,
} from "../Store/TablesStore";

type ActiveTab = "areas" | "tables";
type StatusFilter = "all" | "available" | "occupied";
type MultiOrderFilter = "all" | "yes" | "no";
type ViewMode = "grid" | "list";

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

interface AreaRecord {
  id: number;
  name: string;
  description: string;
  icon: string;
  tables: TableRecord[];
  source?: Section;
}

const tableCssVars = {
  "--area-surface": "var(--card)",
  "--area-muted": "var(--muted)",
  "--area-line": "var(--border)",
  "--area-green-bg": "oklch(0.93 0.08 145 / 0.72)",
  "--area-green-fg": "oklch(0.35 0.11 145)",
  "--area-red-bg": "oklch(0.94 0.08 27 / 0.72)",
  "--area-red-fg": "oklch(0.43 0.15 27)",
  "--area-teal-bg": "oklch(0.92 0.08 190 / 0.72)",
  "--area-teal-fg": "oklch(0.31 0.09 196)",
  "--area-gray-bg": "oklch(0.92 0 0 / 0.72)",
  "--area-gray-fg": "oklch(0.42 0 0)",
  "--area-amber": "oklch(0.78 0.16 75)",
} as CSSProperties;

const areaIcons: Record<string, string> = {
  Terrace: "🏡",
  Balcony: "🌇",
  "Private Room": "🚪",
  Garden: "🌳",
  Bar: "🍸",
  Rooftop: "🌃",
  Family: "👨‍👩‍👧",
  VIP: "⭐",
  Outdoor: "☀️",
  Indoor: "🍽️",
};

const sampleAreas: AreaRecord[] = [
  area("Terrace", "Open-air seating for sunny lunches.", [["T1", 4, false], ["T2", 2, true], ["T3", 4, false]]),
  area("Balcony", "Compact overlook seating for small groups.", [["B1", 2, false], ["B2", 2, false]]),
  area("Private Room", "Quiet enclosed room for meetings and celebrations.", [["P1", 8, true], ["P2", 6, false]]),
  area("Garden", "Green outdoor section for relaxed dining.", [["G1", 4, false], ["G2", 6, false], ["G3", 4, true]]),
  area("Bar", "High-energy counter and lounge tables.", [["BR1", 2, true], ["BR2", 2, true], ["BR3", 4, false]]),
  area("Rooftop", "Evening dining with skyline views.", [["R1", 4, false], ["R2", 4, true]]),
  area("Family", "Roomier tables for families and groups.", [["F1", 6, false], ["F2", 8, true], ["F3", 6, false]]),
  area("VIP", "Premium reserved seating with extra service.", [["V1", 4, true], ["V2", 6, true]]),
  area("Outdoor", "Street-side casual seating.", [["O1", 2, false], ["O2", 4, false], ["O3", 4, false]]),
  area("Indoor", "Main dining room with flexible seating.", [["I1", 4, true], ["I2", 4, false], ["I3", 2, false]]),
];

function area(name: string, description: string, tables: Array<[string, number, boolean]>): AreaRecord {
  const id = Object.keys(areaIcons).indexOf(name) + 1;
  return {
    id,
    name,
    description,
    icon: areaIcons[name] ?? "🍽️",
    tables: tables.map(([tableCode, capacity, isOccupied], index) => ({
      id: `sample-${id}-${index}`,
      tableCode,
      area: name,
      capacity,
      isOccupied,
      canTakeMultipleOrder: capacity >= 4,
      remarks: "",
    })),
  };
}

const toSection = (areaRecord: AreaRecord): Section => ({
  id: areaRecord.id,
  name: areaRecord.name,
  description: areaRecord.description,
  isActive: true,
  totalTables: String(areaRecord.tables.length),
  tablesOccupied: areaRecord.tables.filter((table) => table.isOccupied).length,
  tablesAvailable: areaRecord.tables.filter((table) => !table.isOccupied).length,
});

const resolveTableArea = (table: DiningTable, sections: Section[]) => {
  if (table.section == null) return "Unassigned";
  const raw = String(table.section);
  return sections.find((section) => String(section.id) === raw || section.name === raw)?.name ?? raw;
};

const mapDiningTableToRecord = (table: DiningTable, sections: Section[]): TableRecord => ({
  id: String(table.id),
  tableCode: String(table.tableNumber || "").replace(/^T/, ""),
  area: resolveTableArea(table, sections),
  capacity: Number(table.seatingCapacity) || 0,
  isOccupied: Boolean(table.isOccupied),
  canTakeMultipleOrder: Boolean(table.canHaveMultipleOrders),
  remarks: String(table.specialRequests || ""),
  qrCode: "",
});

export default function TablesPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("tables");
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [multiOrderFilter, setMultiOrderFilter] = useState<MultiOrderFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [expandedAreaId, setExpandedAreaId] = useState<number | null>(null);
  const [selectedArea, setSelectedArea] = useState<Section | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableRecord | null>(null);
  const [isAreaSheetOpen, setIsAreaSheetOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  const { data: sectionsResponse } = useSections(true);
  const { data: diningTablesResponse } = useDiningTables(true);
  const { mutateAsync: createDiningTable } = useCreateDiningTable();
  const { mutateAsync: updateDiningTable } = useUpdateDiningTable();

  const apiSections = sectionsResponse?.data ?? [];
  const apiTables = diningTablesResponse?.data ?? [];

  const areas = useMemo(() => {
    if (apiSections.length === 0) return sampleAreas;

    const tableRecords = apiTables.map((table) => mapDiningTableToRecord(table, apiSections));
    return apiSections.map((section) => {
      const tables = tableRecords.filter((table) => table.area === section.name);
      return {
        id: section.id,
        name: section.name,
        description: section.description || "Restaurant service area.",
        icon: areaIcons[section.name] ?? "🍽️",
        tables,
        source: section,
      };
    });
  }, [apiSections, apiTables]);

  const sectionsForForms = useMemo(() => {
    return apiSections.length > 0 ? apiSections : sampleAreas.map(toSection);
  }, [apiSections]);

  const allTables = useMemo(() => areas.flatMap((areaRecord) => areaRecord.tables), [areas]);
  const filteredAreas = useMemo(() => {
    const term = search.trim().toLowerCase();
    return areas.filter((areaRecord) => {
      const matchesSearch =
        term.length === 0 ||
        areaRecord.name.toLowerCase().includes(term) ||
        areaRecord.description.toLowerCase().includes(term) ||
        areaRecord.tables.some((table) => table.tableCode.toLowerCase().includes(term));

      return matchesSearch;
    });
  }, [areas, search]);

  const filteredTables = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allTables.filter((table) => {
      const matchesSearch =
        term.length === 0 ||
        table.tableCode.toLowerCase().includes(term) ||
        table.area.toLowerCase().includes(term);
      const matchesArea = areaFilter === "all" || table.area === areaFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "available" && !table.isOccupied) ||
        (statusFilter === "occupied" && table.isOccupied);
      const matchesMultiOrder =
        multiOrderFilter === "all" ||
        (multiOrderFilter === "yes" && table.canTakeMultipleOrder) ||
        (multiOrderFilter === "no" && !table.canTakeMultipleOrder);

      return matchesSearch && matchesArea && matchesStatus && matchesMultiOrder;
    });
  }, [allTables, areaFilter, multiOrderFilter, search, statusFilter]);

  const stats = useMemo(() => {
    const occupied = filteredTables.filter((table) => table.isOccupied).length;
    return {
      totalTables: filteredTables.length,
      available: filteredTables.length - occupied,
      occupied,
      seats: filteredTables.reduce((total, table) => total + table.capacity, 0),
    };
  }, [filteredTables]);

  const handleSaveTable = async (table: TableRecord) => {
    if (table.id.startsWith("sample")) {
      errorFunction("Sample tables are read-only. Create a real table to edit it.");
      setIsTableModalOpen(false);
      return;
    }

    const section = sectionsForForms.find((areaRecord) => areaRecord.name === table.area);
    const payload = {
      tableNumber: table.tableCode,
      seatingCapacity: table.capacity,
      section: section?.id ?? null,
      specialRequests: table.remarks || "",
      canHaveMultipleOrders: table.canTakeMultipleOrder,
      isOccupied: table.isOccupied,
    };

    if (selectedTable) {
      await updateDiningTable({ id: Number(selectedTable.id), data: payload });
    } else {
      await createDiningTable(payload);
    }

    setIsTableModalOpen(false);
    setSelectedTable(null);
  };

  const editArea = (areaRecord: AreaRecord) => {
    if (!areaRecord.source) {
      errorFunction("Sample areas are read-only. Create a real area to edit it.");
      return;
    }
    setSelectedArea(areaRecord.source);
    setIsAreaSheetOpen(true);
  };

  const editTable = (table: TableRecord) => {
    if (table.id.startsWith("sample")) {
      errorFunction("Sample tables are read-only. Create a real table to edit it.");
      return;
    }
    setSelectedTable(table);
    setIsTableModalOpen(true);
  };

  return (
    <div className="h-screen overflow-hidden bg-background p-4 md:p-6" style={tableCssVars}>
      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">Tables & Areas</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Monitor dining areas, occupancy, and table availability.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Sheet open={isAreaSheetOpen} onOpenChange={setIsAreaSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    className="h-10 rounded-md"
                    onClick={() => {
                      setSelectedArea(null);
                      setActiveTab("areas");
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Area
                  </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{selectedArea ? "Edit Area" : "New Area"}</SheetTitle>
                    <SheetDescription>
                      {selectedArea ? "Update area details." : "Create a new restaurant area."}
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

              <Button
                variant="outline"
                className="h-10 rounded-md"
                onClick={() => {
                  setSelectedTable(null);
                  setIsTableModalOpen(true);
                  setActiveTab("tables");
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Table
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatCard label="Total Tables" value={stats.totalTables} icon={Table2} />
            <StatCard label="Available" value={stats.available} icon={Users} tone="available" />
            <StatCard label="Occupied" value={stats.occupied} icon={Users} tone="occupied" />
            <StatCard label="Total Seats" value={stats.seats} icon={Users} />
          </div>

          <div className="flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex w-fit rounded-md border border-border bg-muted p-1">
              <button
                type="button"
                onClick={() => setActiveTab("areas")}
                className={cn(
                  "rounded-sm px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "areas" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Areas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tables")}
                className={cn(
                  "rounded-sm px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "tables" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Tables
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 xl:max-w-5xl xl:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by table code or area"
                  className="h-10 rounded-md pl-9"
                />
              </div>

              {activeTab === "tables" ? (
                <>
                  <select
                    value={areaFilter}
                    onChange={(event) => setAreaFilter(event.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 xl:w-40"
                    aria-label="Filter by area"
                  >
                    <option value="all">All Areas</option>
                    {areas.map((areaRecord) => (
                      <option key={areaRecord.id} value={areaRecord.name}>
                        {areaRecord.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 xl:w-40"
                    aria-label="Filter by status"
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                  </select>

                  <select
                    value={multiOrderFilter}
                    onChange={(event) => setMultiOrderFilter(event.target.value as MultiOrderFilter)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 xl:w-48"
                    aria-label="Filter by multi-order support"
                  >
                    <option value="all">All Multi-order</option>
                    <option value="yes">Multi-order: Yes</option>
                    <option value="no">Multi-order: No</option>
                  </select>

                  <div className="flex rounded-md border border-border bg-muted p-1" aria-label="View mode">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                      className="h-8 rounded-sm px-3"
                      aria-pressed="true"
                      title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
                    >
                      {viewMode === "grid" ? (
                        <List className="h-4 w-4" />
                      ) : (
                        <Grid3X3 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {activeTab === "tables" ? (
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredTables.length}</span>{" "}
              table{filteredTables.length === 1 ? "" : "s"}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border bg-card p-3">
          {activeTab === "areas" ? (
            <>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredAreas.map((areaRecord) => (
                  <AreaCard
                    key={areaRecord.id}
                    area={areaRecord}
                    expanded={expandedAreaId === areaRecord.id}
                    onToggle={() =>
                      setExpandedAreaId((current) => (current === areaRecord.id ? null : areaRecord.id))
                    }
                    onEdit={() => editArea(areaRecord)}
                    onDelete={() => errorFunction("Delete area is not implemented yet.")}
                  />
                ))}
              </div>

              {filteredAreas.length === 0 ? <EmptyState text="No areas match your filters." /> : null}

              {expandedAreaId ? (
                <AreaDetailPanel
                  area={areas.find((areaRecord) => areaRecord.id === expandedAreaId) ?? null}
                  onClose={() => setExpandedAreaId(null)}
                  onAddTable={() => {
                    setSelectedTable(null);
                    setIsTableModalOpen(true);
                  }}
                  onEditTable={editTable}
                />
              ) : null}
            </>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {filteredTables.map((table) => (
                <TableListCard
                  key={table.id}
                  table={table}
                  onEdit={() => editTable(table)}
                  onDelete={() => errorFunction("Delete table is not implemented yet.")}
                />
              ))}
              {filteredTables.length === 0 ? <EmptyState text="No tables match your filters." /> : null}
            </div>
          ) : (
            <TablesListView
              tables={filteredTables}
              onEdit={editTable}
              onDelete={() => errorFunction("Delete table is not implemented yet.")}
            />
          )}
        </div>
      </div>

      <TableDetailModal
        open={isTableModalOpen}
        onOpenChange={setIsTableModalOpen}
        table={selectedTable}
        areas={sectionsForForms}
        onSave={handleSaveTable}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Grid3X3;
  tone?: "available" | "occupied";
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold",
              tone === "available" && "text-green-600",
              tone === "occupied" && "text-red-600"
            )}
          >
            {value}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

function AreaCard({
  area,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  area: AreaRecord;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const occupied = area.tables.filter((table) => table.isOccupied).length;
  const available = area.tables.length - occupied;
  const ratio = area.tables.length ? occupied / area.tables.length : 0;
  const progressTone = ratio === 0 ? "bg-green-500" : ratio < 0.67 ? "bg-amber-500" : "bg-red-500";

  const progressWidth = ratio === 0 ? 100 : ratio * 100;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        "group relative flex min-h-[119px] cursor-pointer flex-col rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-foreground/30",
        expanded && "border-foreground/40"
      )}
    >
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <IconButton label={`Edit ${area.name}`} icon={Edit} onClick={onEdit} />
        <IconButton label={`Delete ${area.name}`} icon={Trash2} onClick={onDelete} danger />
      </div>

      <div className="flex items-start gap-2 pr-20">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-xl">
          <span aria-hidden="true">{area.icon}</span>
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{area.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{area.description}</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium">{area.tables.length} tables</span>
        <Pill tone="available">{available} available</Pill>
        <Pill tone="occupied">{occupied} occupied</Pill>
      </div>

      <div className="mt-auto pt-2">
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full", progressTone)} style={{ width: `${progressWidth}%` }} />
        </div>
      </div>
    </article>
  );
}

function AreaDetailPanel({
  area,
  onClose,
  onAddTable,
  onEditTable,
}: {
  area: AreaRecord | null;
  onClose: () => void;
  onAddTable: () => void;
  onEditTable: (table: TableRecord) => void;
}) {
  if (!area) return null;

  return (
    <div className="mt-3 rounded-md border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">{area.icon} {area.name}</h3>
          <p className="text-sm text-muted-foreground">Tables in this area</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close area detail" title="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {area.tables.map((table) => (
          <TableTile key={table.id} table={table} compact onClick={() => onEditTable(table)} />
        ))}
        <button
          type="button"
          onClick={onAddTable}
          className="flex min-h-20 flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/35 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          <Plus className="mb-2 h-5 w-5" />
          Add table
        </button>
      </div>
    </div>
  );
}

function TableListCard({
  table,
  onEdit,
  onDelete,
}: {
  table: TableRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const available = !table.isOccupied;

  return (
    <article
      className={cn(
        "group relative flex min-h-[122px] flex-col rounded-md border border-border bg-background p-3 transition-colors hover:border-foreground/30",
        available ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"
      )}
    >
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <IconButton label={`Edit table ${table.tableCode}`} icon={Edit} onClick={onEdit} />
        <IconButton label={`Delete table ${table.tableCode}`} icon={Trash2} onClick={onDelete} danger />
      </div>

      <div className="pr-20">
        <StatusIdBadge tableCode={table.tableCode} occupied={table.isOccupied} />
        <h3 className="mt-2 line-clamp-1 text-sm font-semibold">Table {table.tableCode}</h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{table.area}</p>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
        <div className="rounded-md border border-border bg-muted/35 p-1.5">
          <p className="text-xs text-muted-foreground">Capacity</p>
          <p className="font-semibold">{table.capacity} seats</p>
        </div>
        <div className="rounded-md  bg-muted/35 p-1.5">
          <p className="text-xs text-muted-foreground">Multi-order</p>
          <div className="mt-0.5">
            <MultiOrderIndicator enabled={table.canTakeMultipleOrder} />
          </div>
        </div>
      </div>

 
    </article>
  );
}

function TablesListView({
  tables,
  onEdit,
  onDelete,
}: {
  tables: TableRecord[];
  onEdit: (table: TableRecord) => void;
  onDelete: (table: TableRecord) => void;
}) {
  if (tables.length === 0) {
    return <EmptyState text="No tables match your filters." />;
  }

  return (
    <div className="max-h-[500px] overflow-auto">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-background">
          <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <th className="px-3 py-3 font-medium">Table ID</th>
            <th className="px-3 py-3 font-medium">Area</th>
            <th className="px-3 py-3 font-medium">Capacity</th>
            <th className="px-3 py-3 font-medium">Multi-order</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tables.map((table) => (
            <tr key={table.id} className="group border-b border-border last:border-b-0 hover:bg-muted/45">
              <td className="px-3 py-3">
                <StatusIdBadge tableCode={table.tableCode} occupied={table.isOccupied} />
              </td>
              <td className="px-3 py-3 font-medium">{table.area}</td>
              <td className="px-3 py-3">{table.capacity} seats</td>
              <td className="px-3 py-3">
                <MultiOrderIndicator enabled={table.canTakeMultipleOrder} />
              </td>
              <td className="px-3 py-3">
                <StatusDot occupied={table.isOccupied} />
              </td>
              <td className="px-3 py-3">
                <div className="flex justify-end gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                  <IconButton label={`Edit table ${table.tableCode}`} icon={Edit} onClick={() => onEdit(table)} />
                  <IconButton
                    label={`Delete table ${table.tableCode}`}
                    icon={Trash2}
                    onClick={() => onDelete(table)}
                    danger
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableTile({
  table,
  compact = false,
  onClick,
}: {
  table: TableRecord;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border p-2 text-left transition-colors",
        table.isOccupied
          ? "border-red-500/35 bg-red-500/10 hover:bg-red-500/15"
          : "border-green-500/35 bg-green-500/10 hover:bg-green-500/15",
        compact ? "min-h-20" : "min-h-[90px]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">T{table.tableCode}</p>
          <p className="text-xs text-muted-foreground">{table.area}</p>
        </div>
        <span className={cn("h-3 w-3 rounded-full", table.isOccupied ? "bg-red-500" : "bg-green-500")} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span>{table.capacity} seats</span>
        <StatusDot occupied={table.isOccupied} />
      </div>
    </button>
  );
}

function StatusIdBadge({ tableCode, occupied }: { tableCode: string; occupied: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-sm px-2 py-1 text-xs font-semibold"
      style={{
        backgroundColor: occupied ? "var(--area-red-bg)" : "var(--area-green-bg)",
        color: occupied ? "var(--area-red-fg)" : "var(--area-green-fg)",
      }}
    >
      T{tableCode}
    </span>
  );
}

function StatusDot({ occupied }: { occupied: boolean }) {
  return (
    <span
      className={cn("inline-flex h-3 w-3 rounded-full", occupied ? "bg-red-500" : "bg-green-500")}
      aria-label={occupied ? "Occupied" : "Available"}
      title={occupied ? "Occupied" : "Available"}
    />
  );
}

function MultiOrderIndicator({ enabled }: { enabled: boolean }) {
  const Icon = enabled ? Check : X;

  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-sm"
      style={{
        backgroundColor: enabled ? "var(--area-teal-bg)" : "var(--area-gray-bg)",
        color: enabled ? "var(--area-teal-fg)" : "var(--area-gray-fg)",
      }}
      aria-label={enabled ? "Multi-order supported" : "Multi-order not supported"}
      title={enabled ? "Multi-order supported" : "Multi-order not supported"}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

function Pill({ children, tone }: { children: string; tone: "available" | "occupied" }) {
  return (
    <span
      className="inline-flex items-center rounded-sm px-2 py-1 text-xs font-medium"
      style={{
        backgroundColor: tone === "available" ? "var(--area-green-bg)" : "var(--area-red-bg)",
        color: tone === "available" ? "var(--area-green-fg)" : "var(--area-red-fg)",
      }}
    >
      {children}
    </span>
  );
}

function IconButton({
  label,
  icon: Icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: typeof Edit;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onClick();
        }
      }}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background",
        danger
          ? "text-destructive hover:bg-destructive hover:text-destructive-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="col-span-full flex min-h-64 items-center justify-center rounded-md border border-dashed border-border bg-muted/35 p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
