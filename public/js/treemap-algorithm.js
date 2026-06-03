const TreemapAlgorithm = (function() {

  function worstAspectRatio(row, sideLength) {
    const min = Math.min(...row);
    const max = Math.max(...row);
    const sum = row.reduce((a, b) => a + b, 0);
    const sumSq = sum * sum;
    const sideSq = sideLength * sideLength;
    return Math.max(
      (sideSq * max) / sumSq,
      sumSq / (sideSq * min)
    );
  }

  function layoutRow(row, bounds, isHorizontal) {
    const rects = [];
    const sum = row.reduce((a, b) => a + b, 0);
    let offset = isHorizontal ? bounds.y : bounds.x;
    const fixedDim = sum / bounds[isHorizontal ? 'height' : 'width'];

    for (const value of row) {
      const variableDim = value / fixedDim;
      if (isHorizontal) {
        rects.push({
          x: bounds.x,
          y: offset,
          width: fixedDim,
          height: variableDim,
          value: value
        });
      } else {
        rects.push({
          x: offset,
          y: bounds.y,
          width: variableDim,
          height: fixedDim,
          value: value
        });
      }
      offset += variableDim;
    }

    return rects;
  }

  function remainingBounds(bounds, row, isHorizontal) {
    const sum = row.reduce((a, b) => a + b, 0);
    const fixedDim = sum / bounds[isHorizontal ? 'height' : 'width'];
    
    if (isHorizontal) {
      return {
        x: bounds.x + fixedDim,
        y: bounds.y,
        width: bounds.width - fixedDim,
        height: bounds.height
      };
    } else {
      return {
        x: bounds.x,
        y: bounds.y + fixedDim,
        width: bounds.width,
        height: bounds.height - fixedDim
      };
    }
  }

  function squarify(values, bounds, currentRow, rects) {
    if (values.length === 0) {
      if (currentRow.length > 0) {
        const isHorizontal = bounds.width >= bounds.height;
        rects.push(...layoutRow(currentRow, bounds, isHorizontal));
      }
      return rects;
    }

    const sideLength = Math.min(bounds.width, bounds.height);
    const nextValue = values[0];
    const extendedRow = [...currentRow, nextValue];

    if (currentRow.length === 0 ||
        worstAspectRatio(extendedRow, sideLength) <= worstAspectRatio(currentRow, sideLength)) {
      return squarify(values.slice(1), bounds, extendedRow, rects);
    } else {
      const isHorizontal = bounds.width >= bounds.height;
      rects.push(...layoutRow(currentRow, bounds, isHorizontal));
      const newBounds = remainingBounds(bounds, currentRow, isHorizontal);
      return squarify(values, newBounds, [], rects);
    }
  }

  function normalizeValues(values, targetArea) {
    const total = values.reduce((a, b) => a + b, 0);
    if (total === 0) return values.map(() => 0);
    const scale = targetArea / total;
    return values.map(v => v * scale);
  }

  function computeLayout(nodes, containerWidth, containerHeight, padding = 0) {
    if (!nodes || nodes.length === 0) return [];

    const sortedNodes = [...nodes].sort((a, b) => b.value - a.value);
    const values = sortedNodes.map(n => n.value);
    const bounds = {
      x: padding,
      y: padding,
      width: containerWidth - 2 * padding,
      height: containerHeight - 2 * padding
    };
    const area = bounds.width * bounds.height;
    const normalizedValues = normalizeValues(values, area);
    const rects = squarify(normalizedValues, bounds, [], []);

    return sortedNodes.map((node, index) => ({
      ...node,
      x: Math.round(rects[index].x * 100) / 100,
      y: Math.round(rects[index].y * 100) / 100,
      width: Math.max(0, Math.round(rects[index].width * 100) / 100),
      height: Math.max(0, Math.round(rects[index].height * 100) / 100),
      aspectRatio: Math.max(
        rects[index].width / rects[index].height,
        rects[index].height / rects[index].width
      )
    }));
  }

  function computeLayoutRecursive(node, containerWidth, containerHeight, padding = 4, minSize = 20, isRoot = true) {
    if (!node.children || node.children.length === 0) {
      return {
        ...node,
        x: isRoot ? 0 : (node.x !== undefined ? node.x : 0),
        y: isRoot ? 0 : (node.y !== undefined ? node.y : 0),
        width: containerWidth,
        height: containerHeight,
        children: []
      };
    }

    const childNodes = node.children.map(child => ({
      ...child,
      value: child.size
    }));

    const layout = computeLayout(childNodes, containerWidth, containerHeight, padding);

    const resultChildren = layout.map(child => {
      if (child.width < minSize || child.height < minSize) {
        return {
          ...child,
          children: []
        };
      }

      const innerPadding = child.type === 'file' ? 0 : padding;
      return computeLayoutRecursive(
        child,
        child.width,
        child.height,
        innerPadding,
        minSize,
        false
      );
    });

    return {
      ...node,
      x: isRoot ? 0 : (node.x !== undefined ? node.x : 0),
      y: isRoot ? 0 : (node.y !== undefined ? node.y : 0),
      width: containerWidth,
      height: containerHeight,
      children: resultChildren
    };
  }

  function validateLayout(layout) {
    const errors = [];
    const totalArea = layout.width * layout.height;
    let topLevelArea = 0;

    function checkNode(node, parentX, parentY, parentW, parentH) {
      const absX = parentX + node.x;
      const absY = parentY + node.y;

      if (absX < parentX - 0.01 || absX + node.width > parentX + parentW + 0.01) {
        errors.push(`节点 ${node.name} X坐标超出父容器范围`);
      }
      if (absY < parentY - 0.01 || absY + node.height > parentY + parentH + 0.01) {
        errors.push(`节点 ${node.name} Y坐标超出父容器范围`);
      }

      if (node.width <= 0 || node.height <= 0) {
        errors.push(`节点 ${node.name} 尺寸无效: ${node.width}x${node.height}`);
      }

      if (node.children && node.children.length > 0) {
        let childSum = 0;
        node.children.forEach(child => {
          childSum += child.width * child.height;
          checkNode(child, absX, absY, node.width, node.height);
        });
        const expectedArea = (node.width - 8) * (node.height - 8);
        const errorRatio = Math.abs(childSum - expectedArea) / expectedArea;
        if (errorRatio > 0.05) {
          errors.push(`节点 ${node.name} 子节点面积和与预期不符: 实际${childSum.toFixed(0)} vs 预期${expectedArea.toFixed(0)} (误差${(errorRatio*100).toFixed(1)}%)`);
        }
      }
    }

    layout.children.forEach(child => {
      topLevelArea += child.width * child.height;
      checkNode(child, 0, 0, layout.width, layout.height);
    });

    return {
      valid: errors.length === 0,
      errors,
      totalArea,
      topLevelArea,
      areaRatio: topLevelArea / ((layout.width - 8) * (layout.height - 8))
    };
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  return {
    computeLayout,
    computeLayoutRecursive,
    validateLayout,
    formatSize
  };
})();
