import { create } from 'zustand';

export const useComicStore = create((set, get) => ({
  rawScript: '',
  parsedScript: null,
  panels: [],
  generatedPanels: {},
  selectedPanelId: null,
  selectedBubbleId: null,
  layoutStyle: 'balanced',
  comicStyle: 'manga',
  gridMode: 'auto',
  isProcessing: false,
  error: null,
  undoStack: [],
  redoStack: [],
  libraryTemplates: [],
  libraryCategories: [],
  activeTab: 'editor',

  setRawScript: (rawScript) => set({ rawScript }),
  
  setParsedScript: (parsedScript) => set({ parsedScript }),
  
  setPanels: (panels) => set({ panels }),
  
  setSelectedPanelId: (id) => set({ selectedPanelId: id }),
  
  setSelectedBubbleId: (id) => set({ selectedBubbleId: id }),
  
  setLayoutStyle: (layoutStyle) => set({ layoutStyle }),
  
  setComicStyle: (comicStyle) => set({ comicStyle }),
  
  setGridMode: (gridMode) => set({ gridMode }),
  
  setActiveTab: (activeTab) => set({ activeTab }),
  
  setProcessing: (isProcessing) => set({ isProcessing }),
  
  setError: (error) => set({ error }),

  setGeneratedPanel: (panelId, generated) => {
    set((state) => ({
      generatedPanels: {
        ...state.generatedPanels,
        [panelId]: generated
      }
    }));
  },

  setGeneratedPanels: (map) => {
    set((state) => ({
      generatedPanels: {
        ...state.generatedPanels,
        ...map
      }
    }));
  },

  setLibraryData: (templates, categories) => {
    set({ libraryTemplates: templates, libraryCategories: categories });
  },

  _snapshot: () => {
    const state = get();
    return {
      panels: JSON.parse(JSON.stringify(state.panels)),
      generatedPanels: JSON.parse(JSON.stringify(state.generatedPanels))
    };
  },

  _pushUndo: () => {
    const snapshot = get()._snapshot();
    set((state) => ({
      undoStack: [...state.undoStack, snapshot],
      redoStack: []
    }));
  },

  undo: () => {
    set((state) => {
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      const current = {
        panels: JSON.parse(JSON.stringify(state.panels)),
        generatedPanels: JSON.parse(JSON.stringify(state.generatedPanels))
      };
      return {
        panels: prev.panels,
        generatedPanels: prev.generatedPanels,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, current]
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      const current = {
        panels: JSON.parse(JSON.stringify(state.panels)),
        generatedPanels: JSON.parse(JSON.stringify(state.generatedPanels))
      };
      return {
        panels: next.panels,
        generatedPanels: next.generatedPanels,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, current]
      };
    });
  },

  updatePanel: (panelId, updates) => {
    get()._pushUndo();
    set((state) => ({
      panels: state.panels.map((p) =>
        p.id === panelId ? { ...p, ...updates } : p
      )
    }));
  },

  updateBubble: (panelId, bubbleId, updates) => {
    get()._pushUndo();
    set((state) => ({
      panels: state.panels.map((p) => {
        if (p.id !== panelId) return p;
        return {
          ...p,
          defaultBubbles: (p.defaultBubbles || []).map((b) =>
            b.id === bubbleId ? { ...b, ...updates } : b
          )
        };
      })
    }));
  },

  reorderPanels: (fromIndex, toIndex) => {
    get()._pushUndo();
    set((state) => {
      const panels = [...state.panels];
      const [removed] = panels.splice(fromIndex, 1);
      panels.splice(toIndex, 0, removed);
      return { panels: panels.map((p, i) => ({ ...p, index: i })) };
    });
  },

  deletePanel: (panelId) => {
    get()._pushUndo();
    set((state) => {
      const panels = state.panels.filter((p) => p.id !== panelId);
      const generatedPanels = { ...state.generatedPanels };
      delete generatedPanels[panelId];
      return {
        panels: panels.map((p, i) => ({ ...p, index: i })),
        generatedPanels,
        selectedPanelId: state.selectedPanelId === panelId ? null : state.selectedPanelId
      };
    });
  },

  addPanel: (afterIndex = -1) => {
    get()._pushUndo();
    set((state) => {
      const newPanel = {
        id: `panel_${Date.now()}`,
        index: afterIndex + 1,
        sceneId: 'custom',
        sceneTitle: '自定义分镜',
        content: { dialogues: [], narrations: [], actions: [], descriptions: [] },
        prompt: '自定义分镜画面',
        sceneType: 'interior',
        isEstablishing: false,
        characters: [],
        suggestedSize: 'standard',
        layoutHints: [],
        defaultBubbles: [],
        pageNumber: 1,
        positionOnPage: 0
      };
      const panels = [...state.panels];
      const insertAt = afterIndex >= 0 ? afterIndex + 1 : panels.length;
      panels.splice(insertAt, 0, newPanel);
      return { panels: panels.map((p, i) => ({ ...p, index: i })) };
    });
  },

  addBubble: (panelId, bubbleData) => {
    get()._pushUndo();
    const newBubble = {
      id: `bubble_${Date.now()}`,
      type: 'speech',
      text: '新气泡',
      character: '未知',
      emotion: 'neutral',
      style: 'round',
      defaultPosition: { x: 50, y: 50, width: 30, height: 15, tailDirection: 'left' },
      ...bubbleData
    };
    set((state) => ({
      panels: state.panels.map((p) => {
        if (p.id !== panelId) return p;
        return {
          ...p,
          defaultBubbles: [...(p.defaultBubbles || []), newBubble]
        };
      })
    }));
    return newBubble.id;
  },

  deleteBubble: (panelId, bubbleId) => {
    get()._pushUndo();
    set((state) => ({
      panels: state.panels.map((p) => {
        if (p.id !== panelId) return p;
        return {
          ...p,
          defaultBubbles: (p.defaultBubbles || []).filter((b) => b.id !== bubbleId)
        };
      }),
      selectedBubbleId: state.selectedBubbleId === bubbleId ? null : state.selectedBubbleId
    }));
  },

  clearAll: () => {
    set({
      rawScript: '',
      parsedScript: null,
      panels: [],
      generatedPanels: {},
      selectedPanelId: null,
      selectedBubbleId: null,
      undoStack: [],
      redoStack: []
    });
  }
}));
