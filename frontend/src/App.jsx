import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ImageCropper from './components/ImageCropper'
import FilterEditor from './components/FilterEditor'

const FILTERS = [
  { id: 'none', name: '原图', filter: '' },
  { id: 'grayscale', name: '黑白', filter: 'grayscale(100%)' },
  { id: 'sepia', name: '复古', filter: 'sepia(80%)' },
  { id: 'brightness', name: '明亮', filter: 'brightness(120%)' },
  { id: 'contrast', name: '高对比', filter: 'contrast(130%)' },
  { id: 'vintage', name: '怀旧', filter: 'sepia(30%) contrast(110%) brightness(90%)' }
]

function App() {
  const [step, setStep] = useState(1)
  const [originalImage, setOriginalImage] = useState(null)
  const [croppedImage, setCroppedImage] = useState(null)
  const [filteredImage, setFilteredImage] = useState(null)
  const [selectedFilter, setSelectedFilter] = useState('none')
  const [styles, setStyles] = useState({})
  const [selectedStyle, setSelectedStyle] = useState(null)
  const [taskId, setTaskId] = useState(null)
  const [processingStatus, setProcessingStatus] = useState(null)
  const [progress, setProgress] = useState(0)
  const [resultImage, setResultImage] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const pollIntervalRef = useRef(null)

  useEffect(() => {
    fetchStyles()
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const fetchStyles = async () => {
    try {
      const response = await axios.get('/api/styles')
      if (response.data.success) {
        setStyles(response.data.styles)
      }
    } catch (error) {
      console.error('Failed to fetch styles:', error)
    }
  }

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setOriginalImage(e.target.result)
        setStep(2)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleCropComplete = (croppedImg) => {
    setCroppedImage(croppedImg)
    setFilteredImage(croppedImg)
    setStep(3)
  }

  const handleFilterChange = (filterId, filteredImg) => {
    setSelectedFilter(filterId)
    setFilteredImage(filteredImg)
  }

  const handleStyleSelect = (styleKey) => {
    setSelectedStyle(styleKey)
  }

  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }

  const startStyleTransfer = async () => {
    if (!filteredImage || !selectedStyle) return

    try {
      const blob = dataURLtoBlob(filteredImage)
      const formData = new FormData()
      formData.append('image', blob, 'image.jpg')

      const uploadResponse = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (uploadResponse.data.success) {
        const tid = uploadResponse.data.task_id
        setTaskId(tid)
        setStep(4)
        setProgress(0)
        setProcessingStatus('queued')

        await axios.post('/api/transfer', {
          task_id: tid,
          style_key: selectedStyle,
          num_steps: 150
        })

        pollIntervalRef.current = setInterval(() => {
          checkTaskStatus(tid)
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to start transfer:', error)
    }
  }

  const checkTaskStatus = async (tid) => {
    try {
      const response = await axios.get(`/api/status/${tid}`)
      if (response.data.success) {
        setProcessingStatus(response.data.status)
        setProgress(response.data.progress || 0)

        if (response.data.status === 'completed') {
          clearInterval(pollIntervalRef.current)
          setResultImage(`/api/result/${response.data.result}`)
          setStep(5)
        } else if (response.data.status === 'error') {
          clearInterval(pollIntervalRef.current)
          alert('处理出错：' + (response.data.error || '未知错误'))
        }
      }
    } catch (error) {
      console.error('Failed to check status:', error)
    }
  }

  const downloadResult = () => {
    if (resultImage) {
      const link = document.createElement('a')
      link.href = resultImage
      link.download = 'style_transfer_result.jpg'
      link.click()
    }
  }

  const resetApp = () => {
    setStep(1)
    setOriginalImage(null)
    setCroppedImage(null)
    setFilteredImage(null)
    setSelectedFilter('none')
    setSelectedStyle(null)
    setTaskId(null)
    setProcessingStatus(null)
    setProgress(0)
    setResultImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getStatusText = () => {
    switch (processingStatus) {
      case 'queued': return '排队中...'
      case 'processing': return 'AI 正在绘制中...'
      case 'completed': return '完成！'
      case 'error': return '出错了'
      default: return '准备中...'
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 AI 图片风格迁移</h1>
        <p>上传照片，选择艺术流派，让 AI 为您创作独特的艺术作品</p>
      </header>

      <div className="step-indicator">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`step ${step === s ? 'active' : step > s ? 'completed' : ''}`}
          >
            {step > s ? '✓' : s}
          </div>
        ))}
      </div>

      <main className="app-main">
        {step === 1 && (
          <section className="upload-section">
            <h2 className="section-title">📷 上传图片</h2>
            <div
              className={`upload-area ${isDragging ? 'dragover' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">🖼️</div>
              <div className="upload-text">点击或拖拽图片到此处上传</div>
              <div className="upload-hint">支持 JPG、PNG 格式，建议使用高清图片</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
          </section>
        )}

        {step === 2 && originalImage && (
          <section className="crop-section">
            <h2 className="section-title">✂️ 裁剪图片</h2>
            <ImageCropper
              image={originalImage}
              onCropComplete={handleCropComplete}
              onCancel={() => setStep(1)}
            />
          </section>
        )}

        {step === 3 && croppedImage && (
          <section className="style-section">
            <h2 className="section-title">🎨 选择艺术风格</h2>
            
            <div className="filter-section">
              <div className="filter-title">📸 滤镜效果（可选）</div>
              <FilterEditor
                image={croppedImage}
                filters={FILTERS}
                selectedFilter={selectedFilter}
                onFilterChange={handleFilterChange}
              />
            </div>

            <div style={{ marginTop: '30px' }}>
              <div className="section-title" style={{ marginBottom: '20px' }}>选择艺术流派</div>
              <div className="style-grid">
                {Object.entries(styles).map(([key, style]) => (
                  <div
                    key={key}
                    className={`style-card ${selectedStyle === key ? 'selected' : ''}`}
                    onClick={() => handleStyleSelect(key)}
                  >
                    <img
                      src={`/api/styles/${key}/image`}
                      alt={style.name}
                      className="style-image"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect fill="%23ddd" width="150" height="150"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">示例</text></svg>'
                      }}
                    />
                    <div className="style-info">
                      <div className="style-name">{style.name}</div>
                      <div className="style-desc">{style.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="button-group">
              <button className="btn btn-secondary" onClick={() => setStep(2)}>
                返回裁剪
              </button>
              <button
                className="btn btn-primary"
                onClick={startStyleTransfer}
                disabled={!selectedStyle}
              >
                开始风格迁移
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="processing-section">
            <h2 className="section-title">⏳ 处理中</h2>
            <div className="status-info">{getStatusText()}</div>
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-text">{progress}%</div>
            </div>
            <div style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
              <p>💡 提示：AI 正在学习大师的绘画风格并应用到您的图片上</p>
              <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>CPU 处理约需 2-5 分钟，GPU 加速约需 30-60 秒</p>
            </div>
          </section>
        )}

        {step === 5 && resultImage && (
          <section className="result-section">
            <h2 className="section-title">🎉 完成！</h2>
            <div className="result-images">
              <div className="image-card">
                <h4>原图</h4>
                <img src={filteredImage} alt="Original" className="result-image" />
              </div>
              <div className="image-card">
                <h4>AI 创作</h4>
                <img src={resultImage} alt="Result" className="result-image" />
              </div>
            </div>
            <div className="button-group">
              <button className="btn btn-secondary" onClick={resetApp}>
                重新开始
              </button>
              <button className="btn btn-primary" onClick={downloadResult}>
                📥 下载结果
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
