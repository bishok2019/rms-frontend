import React, { useState, useEffect } from 'react';

interface Category {
  id: number;
  name: string;
  totalMenuItems: number;
  isActive: boolean;
}

interface MenuCategoryDashboardProps {
  categories?: Category[];
  sendPrompt?: (message: string) => void;
}

const MenuCategoryDashboard: React.FC<MenuCategoryDashboardProps> = ({
  categories = [],
  sendPrompt = (message) => console.log('Prompt:', message)
}) => {
  const [stats, setStats] = useState({
    total: 0,
    totalItems: 0,
    active: 0,
    empty: 0
  });

  const [activeCategories, setActiveCategories] = useState<Category[]>([]);
  const [emptyCategories, setEmptyCategories] = useState<Category[]>([]);

  useEffect(() => {
    const total = categories.length;
    const totalItems = categories.reduce((sum, cat) => sum + cat.totalMenuItems, 0);
    const active = categories.filter(cat => cat.isActive).length;
    const empty = categories.filter(cat => cat.totalMenuItems === 0).length;

    setStats({ total, totalItems, active, empty });

    setActiveCategories(categories.filter(cat => cat.isActive && cat.totalMenuItems > 0));
    setEmptyCategories(categories.filter(cat => cat.totalMenuItems === 0));
  }, [categories]);

  const handleCardDoubleClick = (categoryName: string) => {
    sendPrompt(`Show menu items in ${categoryName}`);
  };

  const handleEditClick = (e: React.MouseEvent, categoryName: string) => {
    e.stopPropagation();
    sendPrompt(`Edit the ${categoryName} category`);
  };

  const getCategoryColor = (index: number) => {
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

  const CategoryCard = ({ category, index, isEmpty = false }: { category: Category; index: number; isEmpty?: boolean }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const colorScheme = isEmpty ? { bg: '#9CA3AF', text: '#FFFFFF' } : getCategoryColor(index);

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
        onDoubleClick={() => handleCardDoubleClick(category.name)}
      >
        {/* Edit Icon */}
        <button
          className={`absolute top-2 right-2 p-1 rounded opacity-0 hover:bg-muted transition-opacity ${isHovered ? 'opacity-100' : ''}`}
          onClick={(e) => handleEditClick(e, category.name)}
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

        {/* Category Name */}
        <h3 className="text-sm font-medium text-foreground mb-2 leading-tight">
          {category.name}
        </h3>

        {/* Badge */}
        <div
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: isEmpty ? 'var(--color-background-secondary)' : 'var(--color-background-success)',
            color: isEmpty ? 'var(--color-text-secondary)' : 'var(--color-text-success)'
          }}
        >
          {isEmpty ? 'Empty' : `${category.totalMenuItems} ${category.totalMenuItems === 1 ? 'item' : 'items'}`}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Hint Text */}
      <p className="text-sm text-muted-foreground text-center">
        Double-click any category card to open menu items filtered by that category.
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total categories" value={stats.total} />
        <StatCard title="Total items" value={stats.totalItems} />
        <StatCard title="Active categories" value={stats.active} />
        <StatCard title="Empty categories" value={stats.empty} />
      </div>

      {/* Active Categories Section */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Active
        </h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {activeCategories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              index={index}
              isEmpty={false}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-border" />

      {/* Empty Categories Section */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Empty
        </h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {emptyCategories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              index={index}
              isEmpty={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuCategoryDashboard;