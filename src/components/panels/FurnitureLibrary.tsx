import React, { useState } from 'react';
import { Sofa, Armchair, Table, Bed, Lamp, Flower2, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { FurnitureCategory, CATEGORY_LABELS } from '@/types';
import { FURNITURE, getFurnitureByCategory } from '@/config/furniture';
import { useSceneStore } from '@/store/useSceneStore';

const categoryIcons: Record<FurnitureCategory, React.ReactNode> = {
  sofa: <Sofa size={20} />,
  chair: <Armchair size={20} />,
  table: <Table size={20} />,
  bed: <Bed size={20} />,
  lamp: <Lamp size={20} />,
  decoration: <Flower2 size={20} />,
};

const categories: FurnitureCategory[] = ['sofa', 'chair', 'table', 'bed', 'lamp', 'decoration'];

export const FurnitureLibrary: React.FC = () => {
  const [expandedCategories, setExpandedCategories] = useState<Set<FurnitureCategory>>(
    new Set(['sofa', 'chair'])
  );
  const { setDragging, isDragging } = useSceneStore();

  const toggleCategory = (category: FurnitureCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleFurnitureClick = (furnitureId: string) => {
    setDragging(true, furnitureId);
  };

  return (
    <div className="w-64 h-full bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 flex flex-col">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sofa size={20} className="text-orange-400" />
          家具库
        </h2>
        <p className="text-xs text-slate-400 mt-1">点击家具后在场景中放置</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {categories.map(category => {
          const items = getFurnitureByCategory(category);
          const isExpanded = expandedCategories.has(category);

          return (
            <div key={category} className="rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-3 py-2.5 flex items-center justify-between bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">{categoryIcons[category]}</span>
                  <span className="text-sm font-medium text-slate-200">
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="text-xs text-slate-500">({items.length})</span>
                </div>
                {isExpanded ? (
                  <ChevronDown size={16} className="text-slate-400" />
                ) : (
                  <ChevronRight size={16} className="text-slate-400" />
                )}
              </button>

              {isExpanded && (
                <div className="p-2 grid grid-cols-2 gap-2 bg-slate-800/30">
                  {items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleFurnitureClick(item.id)}
                      className="p-2 rounded-lg bg-slate-700/30 hover:bg-slate-600/50 border border-slate-600/30 hover:border-orange-500/50 transition-all group"
                    >
                      <div className="aspect-square rounded bg-gradient-to-br from-slate-600/50 to-slate-700/50 flex items-center justify-center mb-1.5 group-hover:from-orange-500/20 group-hover:to-orange-600/20 transition-colors">
                        <span className="text-2xl">🏠</span>
                      </div>
                      <p className="text-xs text-slate-300 text-center truncate">
                        {item.name}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isDragging && (
        <div className="p-3 border-t border-slate-700/50 bg-orange-500/10">
          <div className="flex items-center gap-2 text-sm text-orange-300">
            <Plus size={16} className="animate-pulse" />
            <span>点击场景放置家具</span>
          </div>
          <p className="text-xs text-orange-400/70 mt-1">按 R 键旋转 • ESC 取消</p>
        </div>
      )}
    </div>
  );
};
