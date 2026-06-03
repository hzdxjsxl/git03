import React from 'react';
import { Home, Trash2, Eye, RotateCcw, Download, HelpCircle, Info } from 'lucide-react';
import { useSceneStore } from '@/store/useSceneStore';

export const Toolbar: React.FC = () => {
  const { clearScene, placedItems } = useSceneStore();

  const handleResetView = () => {
    window.location.reload();
  };

  return (
    <div className="h-14 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Home size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">室内装修预览工具</h1>
            <p className="text-slate-400 text-xs">3D Room Designer</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-800/50 rounded-lg">
          <Eye size={14} className="text-slate-400" />
          <span className="text-sm text-slate-300">
            已放置 <span className="text-orange-400 font-medium">{placedItems.length}</span> 件家具
          </span>
        </div>

        <div className="h-6 w-px bg-slate-700 mx-1" />

        <button
          onClick={handleResetView}
          className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
          title="重置视角"
        >
          <RotateCcw size={18} />
        </button>

        <button
          onClick={clearScene}
          className="p-2 rounded-lg bg-slate-800/50 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
          title="清空场景"
        >
          <Trash2 size={18} />
        </button>

        <button
          className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
          title="导出场景"
        >
          <Download size={18} />
        </button>

        <div className="h-6 w-px bg-slate-700 mx-1" />

        <button
          className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
          title="帮助"
        >
          <HelpCircle size={18} />
        </button>

        <button
          className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
          title="关于"
        >
          <Info size={18} />
        </button>
      </div>
    </div>
  );
};
