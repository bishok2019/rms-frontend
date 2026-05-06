import React, { useState, useEffect } from 'react';

interface Section {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  totalTables: string;
  tablesOccupied: number;
  tablesAvailable: number;
}

interface TableAreaDashboardProps {
  sections?: Section[];
  sendPrompt?: (message: string) => void;
}

const TableAreaDashboard: React.FC<TableAreaDashboardProps> = ({
  sections = [],
  sendPrompt = (message) => console.log('Prompt:', message)
}) => {
  const [stats, setStats] = useState({
    total: 0,
    totalTables: 0,
    occupiedTables: 0,
    availableTables: 0
  });

  const [activeAreas, setActiveAreas] = useState<Section[]>([]);
  const [inactiveAreas, setInactiveAreas] = useState<Section[]>([]);

  useEffect(() => {
    const total = sections.length;
    const totalTables = sections.reduce((sum, area) => sum + parseInt(area.totalTables), 0);
    const occupiedTables = sections.reduce((sum, area) => sum + area.tablesOccupied, 0);
    const availableTables = sections.reduce((sum, area) => sum + area.tablesAvailable, 0);

    setStats({ total, totalTables, occupiedTables, availableTables });

    setActiveAreas(sections.filter(area => area.isActive));
    setInactiveAreas(sections.filter(area => !area.isActive));
  }, [sections]);

  const handleCardDoubleClick = (areaName: string) => {
    sendPrompt(`Show tables in ${areaName} area`);
  };

  const handleEditClick = (e: React.MouseEvent, areaName: string) => {
    e.stopPropagation();
    sendPrompt(`Edit the ${areaName} area`);
  };

  const getAreaColor = (index: number) => {
    const colors = [
      { bg: '#3B82F6', text: '#FFFFFF' }, // Blue
      { bg: '#10B981', text: '#FFFFFF' }, // Green
      { bg: '#F59E0B', text: '#FFFFFF' }, // Yellow
      { bg: '#EF4444', text: '#FFFFFF' }, // Red
      { bg: '#8B5CF6', text: '#FFFFFF' }, // Purple
      { bg: '#06B6D4', text: '#FFFFFF' }, // Cyan
      { bg: '#84CC16', text: '#FFFFFF' }, // Lime
      { bg: '#F97316', text: '#FFFFFF' }, // Orange
    ];
    return colors[index % colors.length];
  };

  const StatCard = ({ title, value }: { title: string; value: number }) => (
    <div
      className="p-4 rounded-lg"
      style={{
        backgroundColor: 'var(--color-background-secondary)',
        border: 'none'
      }}
    >
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </div>
  );

  const AreaCard = ({ area, index, isInactive = false }: { area: Section; index: number; isInactive?: boolean }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const colorScheme = isInactive ? { bg: '#9CA3AF', text: '#FFFFFF' } : getAreaColor(index);
    const totalTables = parseInt(area.totalTables);

    return (
      <div
        className="relative p-4 rounded-lg border border-border bg-background cursor-pointer transition-all duration-200 hover:border-primary/50"
        style={{
          transform: isPressed ? 'scale(0.98)' : isHovered ? 'translateY(-2px)' : 'translateY(0)',
          minHeight: '120px'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onDoubleClick={() => handleCardDoubleClick(area.name)}
      >
        {/* Edit Icon */}
        <button
          className={`absolute top-2 right-2 p-1 rounded opacity-0 hover:bg-muted transition-opacity ${isHovered ? 'opacity-100' : ''}`}
          onClick={(e) => handleEditClick(e, area.name)}
          style={{ zIndex: 10 }}
        >
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>

        {/* Icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
          style={{
            backgroundColor: colorScheme.bg,
            color: colorScheme.text
          }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Area Name */}
        <h3 className="text-sm font-medium text-foreground mb-2 leading-tight">
          {area.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {area.description}
        </p>

        {/* Badge */}
        <div
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: isInactive ? 'var(--color-background-secondary)' : 'var(--color-background-success)',
            color: isInactive ? 'var(--color-text-secondary)' : 'var(--color-text-success)'
          }}
        >
          {totalTables} table{totalTables === 1 ? '' : 's'}
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-muted-foreground">{area.tablesAvailable}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-muted-foreground">{area.tablesOccupied}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Hint Text */}
      <p className="text-sm text-muted-foreground text-center">
        Double-click any area card to open tables filtered by that area.
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total areas" value={stats.total} />
        <StatCard title="Total tables" value={stats.totalTables} />
        <StatCard title="Tables occupied" value={stats.occupiedTables} />
        <StatCard title="Tables available" value={stats.availableTables} />
      </div>

      {/* Active Areas Section */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Active Areas
        </h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {activeAreas.map((area, index) => (
            <AreaCard
              key={area.id}
              area={area}
              index={index}
              isInactive={false}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-border" />

      {/* Inactive Areas Section */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Inactive Areas
        </h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {inactiveAreas.map((area, index) => (
            <AreaCard
              key={area.id}
              area={area}
              index={index}
              isInactive={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TableAreaDashboard;