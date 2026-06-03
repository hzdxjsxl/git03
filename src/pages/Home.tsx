import React, { useEffect } from 'react';
import { Toolbar } from '@/components/Toolbar';
import { FurnitureLibrary } from '@/components/panels/FurnitureLibrary';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { SceneRenderer } from '@/engine/SceneRenderer';
import { useSceneStore } from '@/store/useSceneStore';

export const Home: React.FC = () => {
  const { setDragging } = useSceneStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDragging(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDragging]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      <Toolbar />
      
      <div className="flex-1 flex overflow-hidden">
        <FurnitureLibrary />
        
        <div className="flex-1 relative">
          <SceneRenderer />
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/80 backdrop-blur-sm rounded-full border border-slate-700/50">
            <p className="text-xs text-slate-400">
              💡 提示：从左侧选择家具后点击场景放置 • 按 R 旋转 • 按 ESC 取消
            </p>
          </div>
        </div>
        
        <PropertiesPanel />
      </div>
    </div>
  );
};

export default Home;
