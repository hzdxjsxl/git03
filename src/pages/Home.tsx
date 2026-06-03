import React from 'react';
import { Toolbar } from '@/components/Toolbar';
import { FurnitureLibrary } from '@/components/panels/FurnitureLibrary';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { SceneRenderer } from '@/engine/SceneRenderer';
import { useSceneStore } from '@/store/useSceneStore';

export const Home: React.FC = () => {
  const { isDragging, dragFurnitureId } = useSceneStore();

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      <Toolbar />
      
      <div className="flex-1 flex overflow-hidden">
        <FurnitureLibrary />
        
        <div className="flex-1 relative">
          <SceneRenderer />
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/80 backdrop-blur-sm rounded-full border border-slate-700/50 pointer-events-none">
            <p className="text-xs text-slate-400">
              {isDragging && dragFurnitureId
                ? '🎯 点击地板放置家具 • 按 R 旋转 • 按 ESC 取消'
                : '💡 从左侧选择家具后点击场景放置 • 点击家具可选中编辑'}
            </p>
          </div>
        </div>
        
        <PropertiesPanel />
      </div>
    </div>
  );
};

export default Home;
