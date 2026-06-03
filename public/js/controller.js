const TreemapController = (function() {
  let state = {
    rootData: null,
    currentData: null,
    currentPath: [],
    breadcrumb: [],
    layout: null,
    containerWidth: 0,
    containerHeight: 0,
    drillDepth: 1
  };

  let listeners = {
    onDataChange: [],
    onPathChange: [],
    onLayoutChange: []
  };

  async function fetchData(path = '') {
    try {
      const url = path ? `/api/disk-data?path=${encodeURIComponent(path)}` : '/api/disk-data';
      const response = await fetch(url);
      if (!response.ok) throw new Error('数据加载失败');
      return await response.json();
    } catch (error) {
      console.error('获取数据失败:', error);
      throw error;
    }
  }

  async function loadRootData() {
    state.rootData = await fetchData('');
    state.currentData = state.rootData;
    state.currentPath = [];
    state.breadcrumb = [{ name: state.rootData.name, path: '' }];
    updateLayout();
    emit('onDataChange', state.currentData);
    emit('onPathChange', state.breadcrumb);
    return state.currentData;
  }

  function drillDown(node) {
    if (!node.children || node.children.length === 0) return false;
    if (node.type === 'file') return false;

    state.currentPath.push(node.name);
    state.currentData = node;
    state.breadcrumb.push({
      name: node.name,
      path: state.currentPath.join('/')
    });

    updateLayout();
    emit('onDataChange', state.currentData);
    emit('onPathChange', state.breadcrumb);
    return true;
  }

  function drillUp() {
    if (state.currentPath.length === 0) return false;

    state.currentPath.pop();
    state.breadcrumb.pop();

    state.currentData = state.rootData;
    for (const seg of state.currentPath) {
      if (state.currentData.children) {
        state.currentData = state.currentData.children.find(c => c.name === seg) || state.currentData;
      }
    }

    updateLayout();
    emit('onDataChange', state.currentData);
    emit('onPathChange', state.breadcrumb);
    return true;
  }

  function goToPath(pathIndex) {
    if (pathIndex < 0 || pathIndex >= state.breadcrumb.length) return false;
    if (pathIndex === state.breadcrumb.length - 1) return false;

    state.currentPath = state.breadcrumb.slice(1, pathIndex + 1).map(b => b.name);
    state.breadcrumb = state.breadcrumb.slice(0, pathIndex + 1);

    state.currentData = state.rootData;
    for (const seg of state.currentPath) {
      if (state.currentData.children) {
        state.currentData = state.currentData.children.find(c => c.name === seg) || state.currentData;
      }
    }

    updateLayout();
    emit('onDataChange', state.currentData);
    emit('onPathChange', state.breadcrumb);
    return true;
  }

  function setContainerSize(width, height) {
    state.containerWidth = width;
    state.containerHeight = height;
    if (state.currentData) {
      updateLayout();
    }
  }

  function setDrillDepth(depth) {
    state.drillDepth = Math.max(1, depth);
    if (state.currentData) {
      updateLayout();
    }
  }

  function updateLayout() {
    if (!state.currentData || state.containerWidth === 0 || state.containerHeight === 0) {
      return;
    }

    state.layout = TreemapAlgorithm.computeLayoutRecursive(
      state.currentData,
      state.containerWidth,
      state.containerHeight,
      4,
      25
    );

    const validation = TreemapAlgorithm.validateLayout(state.layout);
    if (!validation.valid) {
      console.warn('布局验证警告:', validation.errors);
    }

    emit('onLayoutChange', state.layout);
  }

  function getStatistics() {
    if (!state.currentData) return null;

    const children = state.currentData.children || [];
    let fileCount = 0;
    let folderCount = 0;

    function count(node) {
      if (node.type === 'file') fileCount++;
      if (node.type === 'folder' || node.type === 'disk') folderCount++;
      if (node.children) {
        node.children.forEach(count);
      }
    }
    children.forEach(count);

    return {
      name: state.currentData.name,
      path: state.breadcrumb.map(b => b.name).join('/'),
      totalSize: state.currentData.size,
      itemCount: children.length,
      fileCount,
      folderCount
    };
  }

  function getLayout() {
    return state.layout;
  }

  function getCurrentData() {
    return state.currentData;
  }

  function getBreadcrumb() {
    return [...state.breadcrumb];
  }

  function canDrillDown(node) {
    return node && node.children && node.children.length > 0 && node.type !== 'file';
  }

  function canDrillUp() {
    return state.currentPath.length > 0;
  }

  function on(event, callback) {
    if (listeners[event]) {
      listeners[event].push(callback);
    }
  }

  function off(event, callback) {
    if (listeners[event]) {
      const index = listeners[event].indexOf(callback);
      if (index > -1) {
        listeners[event].splice(index, 1);
      }
    }
  }

  function emit(event, data) {
    if (listeners[event]) {
      listeners[event].forEach(cb => cb(data));
    }
  }

  return {
    loadRootData,
    drillDown,
    drillUp,
    goToPath,
    setContainerSize,
    setDrillDepth,
    getLayout,
    getCurrentData,
    getBreadcrumb,
    getStatistics,
    canDrillDown,
    canDrillUp,
    on,
    off
  };
})();
