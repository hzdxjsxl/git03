(function() {
  let treemapContainer = null;
  let tooltip = null;
  let resizeTimeout = null;

  async function init() {
    treemapContainer = document.getElementById('treemap');
    tooltip = document.getElementById('tooltip');

    if (!treemapContainer) {
      console.error('找不到treemap容器');
      return;
    }

    TreemapRenderer.init(treemapContainer, tooltip);

    setupEventListeners();
    setupControllerListeners();

    if (document.readyState !== 'complete') {
      await new Promise(resolve => window.addEventListener('load', resolve));
    }
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => requestAnimationFrame(resolve));

    updateContainerSize();

    try {
      await TreemapController.loadRootData();
      console.log('磁盘存储深度分析系统已启动');
    } catch (error) {
      console.error('初始化失败:', error);
      if (treemapContainer) {
        treemapContainer.innerHTML = '<div class="empty-state">数据加载失败，请刷新页面重试</div>';
      }
    }
  }

  function setupEventListeners() {
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateContainerSize, 150);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' || e.key === 'Escape') {
        if (TreemapController.canDrillUp()) {
          e.preventDefault();
          TreemapController.drillUp();
        }
      }
    });
  }

  function setupControllerListeners() {
    TreemapController.on('onLayoutChange', (layout) => {
      const stats = TreemapController.getStatistics();
      const validation = TreemapAlgorithm.validateLayout(layout);
      console.log('布局验证:', validation);
      const windows = layout.children.find(c => c.name === 'Windows');
      if (windows) {
        console.log('Windows 节点:', {w: windows.width, h: windows.height, x: windows.x, y: windows.y});
        console.log('Windows 的子节点:', windows.children.map(cc => ({name: cc.name, x: cc.x, y: cc.y, w: cc.width, h: cc.height})));
        const system32 = windows.children.find(c => c.name === 'System32');
        if (system32) {
          console.log('System32 节点:', {w: system32.width, h: system32.height, x: system32.x, y: system32.y});
          console.log('System32 的子节点:', system32.children.map(cc => ({name: cc.name, x: cc.x, y: cc.y, w: cc.width, h: cc.height})));
        }
      }
      TreemapRenderer.render(layout, handleNodeClick);
      TreemapRenderer.renderInfoBar(stats);
    });

    TreemapController.on('onPathChange', (breadcrumb) => {
      TreemapRenderer.renderBreadcrumb(breadcrumb, handleBreadcrumbClick);
    });

    TreemapController.on('onDataChange', (data) => {
      const stats = TreemapController.getStatistics();
      TreemapRenderer.renderInfoBar(stats);
    });
  }

  function updateContainerSize() {
    if (!treemapContainer) return;
    
    const rect = treemapContainer.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    
    if (width > 0 && height > 0) {
      TreemapController.setContainerSize(width, height);
    }
  }

  function handleNodeClick(node) {
    if (TreemapController.canDrillDown(node)) {
      TreemapController.drillDown(node);
    }
  }

  function handleBreadcrumbClick(pathIndex) {
    TreemapController.goToPath(pathIndex);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
