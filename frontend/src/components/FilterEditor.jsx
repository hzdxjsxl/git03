import React, { useState, useEffect, useRef } from 'react'

function FilterEditor({ image, filters, selectedFilter, onFilterChange }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (image && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = 300
        canvas.height = 300
        
        const scale = Math.max(300 / img.width, 300 / img.height)
        const x = (300 - img.width * scale) / 2
        const y = (300 - img.height * scale) / 2
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
      }
      img.src = image
    }
  }, [image])

  const applyFilter = (filterId, filterValue) => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      tempCanvas.width = 300
      tempCanvas.height = 300
      
      const scale = Math.max(300 / img.width, 300 / img.height)
      const x = (300 - img.width * scale) / 2
      const y = (300 - img.height * scale) / 2
      
      tempCtx.filter = filterValue
      tempCtx.drawImage(img, x, y, img.width * scale, img.height * scale)
      
      const filteredDataUrl = tempCanvas.toDataURL('image/jpeg', 0.95)
      onFilterChange(filterId, filteredDataUrl)
    }
    img.src = image
  }

  return (
    <div>
      <div className="filter-grid">
        {filters.map((filter) => (
          <button
            key={filter.id}
            className={`filter-btn ${selectedFilter === filter.id ? 'active' : ''}`}
            onClick={() => applyFilter(filter.id, filter.filter)}
          >
            {filter.name}
          </button>
        ))}
      </div>
      <div style={{ display: 'none' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

export default FilterEditor
