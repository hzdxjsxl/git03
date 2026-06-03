import React from 'react';
import { Settings, RotateCw, Trash2, Palette, Move, Layers } from 'lucide-react';
import { useSceneStore, useSelectedItem } from '@/store/useSceneStore';
import { getFurnitureById } from '@/config/furniture';
import { getMaterialById, MATERIALS } from '@/config/materials';

export const PropertiesPanel: React.FC = () => {
  const selectedItem = useSelectedItem();
  const { updateFurniture, removeFurniture, selectItem } = useSceneStore();

  const furniture = selectedItem ? getFurnitureById(selectedItem.furnitureId) : null;
  const currentMaterial = selectedItem ? getMaterialById(selectedItem.materialId) : null;

  const handleRotate = (delta: number) => {
    if (!selectedItem) return;
    updateFurniture(selectedItem.instanceId, {
      rotation: [
        selectedItem.rotation[0],
        selectedItem.rotation[1] + delta,
        selectedItem.rotation[2],
      ],
    });
  };

  const handleMaterialChange = (materialId: string) => {
    if (!selectedItem) return;
    updateFurniture(selectedItem.instanceId, { materialId });
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    removeFurniture(selectedItem.instanceId);
  };

  const availableMaterials = furniture?.availableMaterials || [];

  return (
    <div className="w-72 h-full bg-slate-900/95 backdrop-blur-sm border-l border-slate-700/50 flex flex-col">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Settings size={20} className="text-orange-400" />
          属性面板
        </h2>
      </div>

      {selectedItem && furniture ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Layers size={14} />
              选中物体
            </h3>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-white font-medium">{furniture.name}</p>
              <p className="text-xs text-slate-400 mt-1">ID: {selectedItem.instanceId.slice(0, 12)}...</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <RotateCw size={14} />
              旋转
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleRotate(-Math.PI / 4)}
                className="flex-1 py-2 px-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm text-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCw size={14} className="rotate-180" />
                -45°
              </button>
              <button
                onClick={() => handleRotate(Math.PI / 4)}
                className="flex-1 py-2 px-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm text-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCw size={14} />
                +45°
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              当前角度: {Math.round((selectedItem.rotation[1] * 180) / Math.PI)}°
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Palette size={14} />
              材质替换
            </h3>
            {currentMaterial && (
              <div className="mb-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg border border-slate-600"
                    style={{ backgroundColor: currentMaterial.color }}
                  />
                  <div>
                    <p className="text-sm text-white font-medium">{currentMaterial.name}</p>
                    <p className="text-xs text-slate-400">
                      粗糙度: {currentMaterial.roughness} • 金属度: {currentMaterial.metalness}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2">
              {availableMaterials.map(materialId => {
                const material = getMaterialById(materialId);
                if (!material) return null;
                const isSelected = selectedItem.materialId === materialId;
                
                return (
                  <button
                    key={materialId}
                    onClick={() => handleMaterialChange(materialId)}
                    className={`p-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-slate-600/50 hover:border-slate-500 bg-slate-800/30'
                    }`}
                  >
                    <div
                      className="w-full aspect-square rounded mb-1"
                      style={{ backgroundColor: material.color }}
                    />
                    <p className="text-xs text-slate-300 text-center truncate">
                      {material.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Move size={14} />
              位置
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-slate-800/50 rounded-lg text-center">
                <p className="text-xs text-slate-500">X</p>
                <p className="text-sm text-slate-200">{selectedItem.position[0].toFixed(2)}</p>
              </div>
              <div className="p-2 bg-slate-800/50 rounded-lg text-center">
                <p className="text-xs text-slate-500">Y</p>
                <p className="text-sm text-slate-200">{selectedItem.position[1].toFixed(2)}</p>
              </div>
              <div className="p-2 bg-slate-800/50 rounded-lg text-center">
                <p className="text-xs text-slate-500">Z</p>
                <p className="text-sm text-slate-200">{selectedItem.position[2].toFixed(2)}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleDelete}
            className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-400 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            删除家具
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-800/50 flex items-center justify-center">
              <Move size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm">点击场景中的家具</p>
            <p className="text-slate-500 text-xs mt-1">查看和编辑属性</p>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-slate-700/50">
        <div className="text-xs text-slate-500 space-y-1">
          <p>• 左键拖拽: 旋转视角</p>
          <p>• 右键拖拽: 平移视角</p>
          <p>• 滚轮: 缩放</p>
          <p>• 点击家具: 选中物体</p>
        </div>
      </div>
    </div>
  );
};
