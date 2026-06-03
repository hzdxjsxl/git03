const TreemapRenderer = (function() {
  let container = null;
  let tooltip = null;
  let options = {
    showLabels: true,
    showSizes: true,
    minLabelSize: 40,
    animationDuration: 300
  };

  function init(containerElement, tooltipElement) {
    container = containerElement;
    tooltip = tooltipElement;
  }

  function render(layout, onNodeClick) {
    if (!container) {
      console.error('渲染器未初始化');
      return;
    }

    container.innerHTML = '';

    if (!layout || !layout.children || layout.children.length === 0) {
      renderEmptyState();
      return;
    }

    const fragment = document.createDocumentFragment();

    layout.children.forEach((node, index) => {
      const nodeElement = createNodeElement(node, onNodeClick, 0);
      fragment.appendChild(nodeElement);
    });

    container.appendChild(fragment);
  }

  function createNodeElement(node, onNodeClick, depth) {
    const div = document.createElement('div');
    div.className = `treemap-node ${node.type}`;
    div.setAttribute('role', 'button');
    div.setAttribute('aria-label', `${node.name} (${TreemapAlgorithm.formatSize(node.size)})`);
    div.setAttribute('data-name', node.name);
    div.setAttribute('data-depth', depth);
    
    if (TreemapController.canDrillDown(node)) {
      div.classList.add('drillable');
      div.setAttribute('aria-haspopup', 'true');
    }

    div.style.left = node.x + 'px';
    div.style.top = node.y + 'px';
    div.style.width = node.width + 'px';
    div.style.height = node.height + 'px';
    div.style.zIndex = depth * 10;

    const hueShift = (depth * 30) % 360;
    if (depth > 0) {
      div.style.filter = `hue-rotate(${hueShift}deg) saturate(${1 - depth * 0.15})`;
    }

    if (options.showLabels && node.width > options.minLabelSize && node.height > 25) {
      const label = document.createElement('div');
      label.className = 'node-label';
      label.textContent = node.name;
      div.appendChild(label);
    }

    if (options.showSizes && node.width > options.minLabelSize && node.height > 40) {
      const sizeLabel = document.createElement('div');
      sizeLabel.className = 'node-size';
      sizeLabel.textContent = TreemapAlgorithm.formatSize(node.size);
      div.appendChild(sizeLabel);
    }

    if (node.children && node.children.length > 0 && node.width > 30 && node.height > 30) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'node-children';
      childrenContainer.style.pointerEvents = 'none';
      
      node.children.forEach(child => {
        const childElement = createNodeElement(child, null, depth + 1);
        childElement.style.pointerEvents = 'none';
        childrenContainer.appendChild(childElement);
      });
      
      div.appendChild(childrenContainer);
    }

    if (TreemapController.canDrillDown(node) && onNodeClick) {
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        onNodeClick(node);
      });
    }

    div.addEventListener('mouseenter', (e) => showTooltip(e, node));
    div.addEventListener('mousemove', moveTooltip);
    div.addEventListener('mouseleave', hideTooltip);

    return div;
  }

  function renderBreadcrumb(breadcrumb, onBreadcrumbClick) {
    const container = document.getElementById('breadcrumb');
    if (!container) return;

    container.innerHTML = '';

    if (breadcrumb.length > 1) {
      const backBtn = document.createElement('button');
      backBtn.className = 'back-button';
      backBtn.textContent = '返回上一级';
      backBtn.addEventListener('click', () => {
        TreemapController.drillUp();
      });
      container.appendChild(backBtn);
    }

    breadcrumb.forEach((item, index) => {
      if (index > 0) {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = '›';
        container.appendChild(separator);
      }

      const crumb = document.createElement('span');
      crumb.className = 'breadcrumb-item';
      if (index === breadcrumb.length - 1) {
        crumb.classList.add('current');
      }
      crumb.textContent = item.name;
      crumb.dataset.pathIndex = index;
      crumb.setAttribute('role', 'button');
      crumb.setAttribute('aria-label', `跳转到 ${item.name}`);

      if (index !== breadcrumb.length - 1 && onBreadcrumbClick) {
        crumb.addEventListener('click', () => {
          onBreadcrumbClick(index);
        });
      }

      container.appendChild(crumb);
    });
  }

  function renderInfoBar(stats) {
    const pathEl = document.getElementById('currentPath');
    const sizeEl = document.getElementById('totalSize');
    const countEl = document.getElementById('itemCount');

    if (pathEl && stats) {
      pathEl.textContent = `当前位置: ${stats.path}`;
    }
    if (sizeEl && stats) {
      sizeEl.textContent = `总大小: ${TreemapAlgorithm.formatSize(stats.totalSize)}`;
    }
    if (countEl && stats) {
      countEl.textContent = `项目数: ${stats.itemCount} (文件夹:${stats.folderCount}, 文件:${stats.fileCount})`;
    }
  }

  function renderEmptyState() {
    if (!container) return;
    container.innerHTML = '<div class="empty-state">当前目录为空</div>';
  }

  function showTooltip(event, node) {
    if (!tooltip) return;

    const typeNames = {
      disk: '磁盘',
      folder: '文件夹',
      file: '文件'
    };

    let html = `<div class="tooltip-name">${node.name}</div>`;
    html += `<div class="tooltip-row"><span class="tooltip-label">类型</span><span class="tooltip-value">${typeNames[node.type] || node.type}</span></div>`;
    html += `<div class="tooltip-row"><span class="tooltip-label">大小</span><span class="tooltip-value">${TreemapAlgorithm.formatSize(node.size)}</span></div>`;
    
    if (node.aspectRatio) {
      html += `<div class="tooltip-row"><span class="tooltip-label">纵横比</span><span class="tooltip-value">${node.aspectRatio.toFixed(2)}:1</span></div>`;
    }
    
    if (node.children && node.children.length > 0) {
      html += `<div class="tooltip-row"><span class="tooltip-label">子项</span><span class="tooltip-value">${node.children.length} 个</span></div>`;
    }

    if (TreemapController.canDrillDown(node)) {
      html += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.2);color:#00d4ff;font-size:12px;">点击查看详情 →</div>`;
    }

    tooltip.innerHTML = html;
    tooltip.classList.add('visible');
    moveTooltip(event);
  }

  function moveTooltip(event) {
    if (!tooltip) return;
    
    const padding = 15;
    let x = event.clientX + padding;
    let y = event.clientY + padding;

    const rect = tooltip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 10) {
      x = event.clientX - rect.width - padding;
    }
    if (y + rect.height > window.innerHeight - 10) {
      y = event.clientY - rect.height - padding;
    }

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  function hideTooltip() {
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  }

  function setOptions(newOptions) {
    options = { ...options, ...newOptions };
  }

  return {
    init,
    render,
    renderBreadcrumb,
    renderInfoBar,
    setOptions,
    showTooltip,
    hideTooltip
  };
})();
