import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CalendarDays,
  CreditCard,
  HandCoins,
  Landmark,
  PackageCheck,
  Plus,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Users,
  WalletCards,
} from "lucide-react";

type ReportTab = "overview" | "finance" | "order";
type Trend = "up" | "down" | "none";
type KpiTone = "blue" | "orange" | "green" | "red" | "teal" | "purple";

interface KpiItem {
  label: string;
  value: string;
  trend: Trend;
  trendLabel: string;
  tone: KpiTone;
  icon: ReactNode;
}

interface LineSeries {
  name: string;
  color: string;
  points: number[];
}

const reportVars = {
  "--report-surface": "var(--card)",
  "--report-muted": "var(--muted)",
  "--report-line": "var(--border)",
  "--report-text": "var(--foreground)",
  "--report-subtle": "var(--muted-foreground)",
  "--report-blue": "oklch(0.55 0.17 255)",
  "--report-orange": "oklch(0.68 0.18 55)",
  "--report-green": "oklch(0.58 0.15 145)",
  "--report-red": "oklch(0.58 0.2 25)",
  "--report-teal": "oklch(0.58 0.12 190)",
  "--report-purple": "oklch(0.55 0.18 300)",
} as CSSProperties;

const timeLabels = ["8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM", "8 PM"];
const overviewSales = [820, 1040, 1690, 1380, 1820, 2110, 2470];
const financeSales = [940, 1180, 1550, 1720, 1680, 2310, 2620];
const orderDineIn = [18, 24, 35, 30, 38, 45, 50];
const orderDelivery = [8, 12, 20, 18, 24, 28, 34];
const orderKot = [32, 42, 58, 53, 68, 77, 88];

const tabLabels: Array<{ id: ReportTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "finance", label: "Finance" },
  { id: "order", label: "Order" },
];

const currency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

function EmptyState() {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--report-line)] text-[var(--report-subtle)]">
      <ReceiptText className="h-8 w-8 opacity-60" />
      <span className="text-sm font-medium">No data yet</span>
    </div>
  );
}

function TrendBadge({ trend, label }: { trend: Trend; label: string }) {
  const styles =
    trend === "up"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : trend === "down"
        ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
        : "bg-muted text-muted-foreground";
  const Icon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : null;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${styles}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}

function KpiBar({ items, columns }: { items: KpiItem[]; columns: "four" | "six" }) {
  const gridClass =
    columns === "six"
      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-6"
      : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";

  return (
    <div className={`grid gap-3 ${gridClass}`}>
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-[var(--report-line)] bg-[var(--report-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-white"
              style={{ backgroundColor: `var(--report-${item.tone})` }}
            >
              {item.icon}
            </span>
            <TrendBadge trend={item.trend} label={item.trendLabel} />
          </div>
          <div className="mt-4">
            <p className="text-sm text-[var(--report-subtle)]">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-[var(--report-text)]">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Sparkline({ points, color = "var(--report-blue)" }: { points: number[]; color?: string }) {
  if (points.length === 0) return <EmptyState />;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(max - min, 1);
  const d = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 160;
      const y = 48 - ((point - min) / range) * 40;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 160 56" className="h-14 w-full" role="img" aria-label="Sales sparkline">
      <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LineChart({ series, labels = timeLabels, height = 280 }: { series: LineSeries[]; labels?: string[]; height?: number }) {
  const values = series.flatMap((item) => item.points);
  if (values.length === 0) return <EmptyState />;

  const width = 760;
  const padding = { top: 18, right: 18, bottom: 38, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const max = Math.max(...values);
  const min = Math.min(0, ...values);
  const range = Math.max(max - min, 1);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((step) => Math.round(min + range * step));

  const pathFor = (points: number[]) =>
    points
      .map((point, index) => {
        const x = padding.left + (index / Math.max(points.length - 1, 1)) * chartWidth;
        const y = padding.top + chartHeight - ((point - min) / range) * chartHeight;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-h-[240px] w-full" role="img" aria-label="Line chart">
        {yTicks.map((tick) => {
          const y = padding.top + chartHeight - ((tick - min) / range) * chartHeight;
          return (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="var(--report-line)" />
              <text x={padding.left - 12} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
                {tick}
              </text>
            </g>
          );
        })}
        {labels.map((label, index) => {
          const x = padding.left + (index / Math.max(labels.length - 1, 1)) * chartWidth;
          return (
            <text key={label} x={x} y={height - 12} textAnchor="middle" className="fill-muted-foreground text-[11px]">
              {label}
            </text>
          );
        })}
        {series.map((item) => (
          <path
            key={item.name}
            d={pathFor(item.points)}
            fill="none"
            stroke={item.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      {series.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--report-subtle)]">
          {series.map((item) => (
            <span key={item.name} className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DonutChart({ segments, totalLabel }: { segments: Array<{ label: string; value: number; color: string }>; totalLabel: string }) {
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <EmptyState />;

  let offset = 25;

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90" role="img" aria-label={totalLabel}>
        <circle cx="60" cy="60" r="42" fill="none" stroke="var(--report-muted)" strokeWidth="16" />
        {segments.map((segment) => {
          const dash = (segment.value / total) * 263.89;
          const circle = (
            <circle
              key={segment.label}
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke={segment.color}
              strokeWidth="16"
              strokeDasharray={`${dash} ${263.89 - dash}`}
              strokeDashoffset={offset}
            />
          );
          offset -= dash;
          return circle;
        })}
      </svg>
      <div className="space-y-2">
        <p className="text-sm text-[var(--report-subtle)]">{totalLabel}</p>
        <p className="text-2xl font-bold">{total.toLocaleString("en-IN")}</p>
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
            <span className="text-[var(--report-subtle)]">{segment.label}</span>
            <span className="font-semibold">{segment.value.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-lg border border-[var(--report-line)] bg-[var(--report-surface)] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function RankedList({ rows }: { rows: Array<{ label: string; value: string; meta?: string }> }) {
  if (rows.length === 0) return <EmptyState />;
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.label} className="flex items-center justify-between gap-3 rounded-md border border-[var(--report-line)] px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--report-muted)] text-xs font-bold">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold">{row.label}</p>
              {row.meta && <p className="text-xs text-[var(--report-subtle)]">{row.meta}</p>}
            </div>
          </div>
          <span className="text-sm font-bold">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function OverviewTab() {
  const kpis: KpiItem[] = [
    { label: "Sales", value: currency(7742), trend: "up", trendLabel: "12.4%", tone: "blue", icon: <ReceiptText className="h-5 w-5" /> },
    { label: "Purchase", value: currency(3120), trend: "down", trendLabel: "3.1%", tone: "orange", icon: <ShoppingCart className="h-5 w-5" /> },
    { label: "Income", value: currency(5210), trend: "up", trendLabel: "8.8%", tone: "green", icon: <HandCoins className="h-5 w-5" /> },
    { label: "Expenses", value: currency(1640), trend: "none", trendLabel: "No changes", tone: "red", icon: <WalletCards className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-4">
      <KpiBar items={kpis} columns="four" />
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Sales Breakdown">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--report-subtle)]">Total sales</p>
              <p className="text-3xl font-bold">{currency(7742)}</p>
            </div>
            <div className="w-40">
              <Sparkline points={overviewSales} />
            </div>
          </div>
          <RankedList
            rows={[
              { label: "Dine In", value: currency(3380), meta: "42 orders" },
              { label: "Reservation", value: currency(1260), meta: "12 bookings" },
              { label: "Delivery", value: currency(1880), meta: "24 orders" },
              { label: "Takeaway", value: currency(1222), meta: "18 orders" },
            ]}
          />
        </Panel>
        <Panel title="Sales Overview">
          <LineChart series={[{ name: "Revenue", color: "var(--report-blue)", points: overviewSales }]} />
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Sales By Staff">
          <RankedList rows={[
            { label: "Aarav Shrestha", value: currency(2840), meta: "28 bills" },
            { label: "Mira Thapa", value: currency(2380), meta: "24 bills" },
            { label: "Nabin Karki", value: currency(1510), meta: "18 bills" },
          ]} />
        </Panel>
        <Panel title="Top Customers">
          <RankedList rows={[
            { label: "Bishok Gurung", value: currency(1840), meta: "6 visits" },
            { label: "Sanjana Rai", value: currency(1420), meta: "4 visits" },
            { label: "Pratik Joshi", value: currency(1160), meta: "3 visits" },
          ]} />
        </Panel>
        <Panel title="Delivery Platform">
          <RankedList rows={[
            { label: "Foodmandu", value: currency(960), meta: "12 orders" },
            { label: "Pathao Food", value: currency(720), meta: "9 orders" },
            { label: "Direct Delivery", value: currency(200), meta: "3 orders" },
          ]} />
        </Panel>
      </div>
    </div>
  );
}

function FinanceTab() {
  const kpis: KpiItem[] = [
    { label: "Sales", value: currency(7742), trend: "up", trendLabel: "12.4%", tone: "blue", icon: <ReceiptText className="h-5 w-5" /> },
    { label: "Purchase", value: currency(3120), trend: "down", trendLabel: "3.1%", tone: "orange", icon: <ShoppingCart className="h-5 w-5" /> },
    { label: "Income", value: currency(5210), trend: "up", trendLabel: "8.8%", tone: "green", icon: <HandCoins className="h-5 w-5" /> },
    { label: "Expenses", value: currency(1640), trend: "none", trendLabel: "No changes", tone: "red", icon: <WalletCards className="h-5 w-5" /> },
    { label: "Payment In", value: currency(6900), trend: "up", trendLabel: "7.2%", tone: "teal", icon: <BanknoteArrowDown className="h-5 w-5" /> },
    { label: "Payment Out", value: currency(2140), trend: "down", trendLabel: "2.4%", tone: "purple", icon: <BanknoteArrowUp className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-4">
      <KpiBar items={kpis} columns="six" />
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Panel title="Sales Overview">
          <LineChart series={[{ name: "Sales", color: "var(--report-blue)", points: financeSales }]} height={320} />
        </Panel>
        <Panel title="Sales Summary">
          <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-md border border-[var(--report-line)] p-3">
              <p className="text-[var(--report-subtle)]">Total</p>
              <p className="font-bold">{currency(7742)}</p>
            </div>
            <div className="rounded-md border border-[var(--report-line)] p-3">
              <p className="text-[var(--report-subtle)]">Paid</p>
              <p className="font-bold">{currency(6900)}</p>
            </div>
            <div className="rounded-md border border-[var(--report-line)] p-3">
              <p className="text-[var(--report-subtle)]">Unpaid</p>
              <p className="font-bold">{currency(842)}</p>
            </div>
          </div>
          <DonutChart
            totalLabel="Sales amount"
            segments={[
              { label: "Paid", value: 6900, color: "var(--report-green)" },
              { label: "Unpaid", value: 842, color: "var(--report-orange)" },
            ]}
          />
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Recent Payment Transactions">
          <RankedList rows={[
            { label: "INV-2048", value: currency(1240), meta: "Card payment · 8:42 PM" },
            { label: "INV-2047", value: currency(860), meta: "Cash payment · 8:18 PM" },
            { label: "SUP-088", value: currency(2140), meta: "Supplier payout · 6:05 PM" },
            { label: "INV-2046", value: currency(1540), meta: "Fonepay · 5:48 PM" },
          ]} />
        </Panel>
        <Panel
          title="Payment Methods"
          action={
            <button className="inline-flex h-8 items-center gap-2 rounded-md border border-[var(--report-line)] px-3 text-sm font-semibold hover:bg-[var(--report-muted)]">
              <Plus className="h-4 w-4" />
              Add Payment Method
            </button>
          }
        >
          <RankedList rows={[
            { label: "Cash", value: currency(2640), meta: "34%" },
            { label: "Card", value: currency(2180), meta: "28%" },
            { label: "Fonepay", value: currency(2080), meta: "27%" },
          ]} />
        </Panel>
      </div>
    </div>
  );
}

function OrderTab() {
  const [dateFilter, setDateFilter] = useState("Today");
  const kpis: KpiItem[] = [
    { label: "Sales", value: currency(7742), trend: "up", trendLabel: "12.4%", tone: "blue", icon: <ReceiptText className="h-5 w-5" /> },
    { label: "Orders Served", value: "96", trend: "up", trendLabel: "9.8%", tone: "green", icon: <PackageCheck className="h-5 w-5" /> },
    { label: "KOT Taken", value: "142", trend: "up", trendLabel: "14.5%", tone: "orange", icon: <ShoppingBag className="h-5 w-5" /> },
    { label: "Avg Order Amount", value: currency(806), trend: "none", trendLabel: "No changes", tone: "purple", icon: <Landmark className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-4">
      <KpiBar items={kpis} columns="four" />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Order Insight"
          action={
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="h-8 rounded-md border border-[var(--report-line)] bg-background px-3 text-sm"
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          }
        >
          <LineChart
            series={[
              { name: "Dine In", color: "var(--report-blue)", points: orderDineIn },
              { name: "Delivery", color: "var(--report-teal)", points: orderDelivery },
              { name: "Total KOT", color: "var(--report-orange)", points: orderKot },
            ]}
            height={320}
          />
        </Panel>
        <Panel title="Live Order Status">
          <DonutChart
            totalLabel="Total orders"
            segments={[
              { label: "Completed", value: 96, color: "var(--report-green)" },
              { label: "Pending", value: 34, color: "var(--report-orange)" },
              { label: "Cancelled", value: 12, color: "var(--report-red)" },
            ]}
          />
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Checkout Breakdown">
          <RankedList rows={[
            { label: "Fully Paid", value: "82 orders", meta: currency(6900) },
            { label: "Partially Paid", value: "9 orders", meta: currency(620) },
            { label: "Unpaid", value: "5 orders", meta: currency(222) },
          ]} />
        </Panel>
        <Panel title="Order Services">
          <RankedList rows={[
            { label: "Dine In", value: "50 orders", meta: currency(3380) },
            { label: "Delivery", value: "34 orders", meta: currency(1880) },
            { label: "Takeaway", value: "18 orders", meta: currency(1222) },
          ]} />
        </Panel>
        <Panel title="Delivery Platform">
          <RankedList rows={[
            { label: "Foodmandu", value: "12 orders", meta: currency(960) },
            { label: "Pathao Food", value: "9 orders", meta: currency(720) },
            { label: "Direct Delivery", value: "3 orders", meta: currency(200) },
          ]} />
        </Panel>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [dateRange, setDateRange] = useState("Today");
  const [daybook, setDaybook] = useState("Main Daybook");

  const activeContent = useMemo(() => {
    if (activeTab === "finance") return <FinanceTab />;
    if (activeTab === "order") return <OrderTab />;
    return <OverviewTab />;
  }, [activeTab]);

  return (
    <div style={reportVars} className="h-full overflow-y-auto bg-background p-4 md:p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal md:text-3xl">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-[var(--report-subtle)]">Restaurant POS performance, payments, and order activity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--report-line)] bg-[var(--report-surface)] px-3 text-sm">
            <CalendarDays className="h-4 w-4 text-[var(--report-subtle)]" />
            <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="bg-transparent outline-none">
              <option>Today</option>
              <option>Yesterday</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </label>
          <label className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--report-line)] bg-[var(--report-surface)] px-3 text-sm">
            <CreditCard className="h-4 w-4 text-[var(--report-subtle)]" />
            <select value={daybook} onChange={(event) => setDaybook(event.target.value)} className="bg-transparent outline-none">
              <option>Main Daybook</option>
              <option>Cash Daybook</option>
              <option>Digital Daybook</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-[var(--report-line)]">
        {tabLabels.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-[var(--report-subtle)] hover:text-[var(--report-text)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeContent}
    </div>
  );
}
