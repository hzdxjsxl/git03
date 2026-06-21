/**
 * 前端主逻辑模块
 * 负责串联 API 模块、标注组件和 UI 交互
 * 不直接操作 DOM，处理用户交互逻辑
 */

(function () {
    let annotator = null;
    let currentFile = null;
    let currentImageUrl = null;
    let currentResult = null;
    let isDetecting = false;

    const WARNING_THRESHOLD = ImageAnnotator.getWarningThreshold();

    const els = {};

    function init() {
        cacheElements();
        initAnnotator();
        bindEvents();
        checkHealth();
    }

    function cacheElements() {
        els.uploadArea = document.getElementById("uploadArea");
        els.fileInput = document.getElementById("fileInput");
        els.thresholdSlider = document.getElementById("thresholdSlider");
        els.thresholdValue = document.getElementById("thresholdValue");
        els.detectBtn = document.getElementById("detectBtn");
        els.resetBtn = document.getElementById("resetBtn");
        els.showBoxes = document.getElementById("showBoxes");
        els.showLabels = document.getElementById("showLabels");
        els.imagePlaceholder = document.getElementById("imagePlaceholder");
        els.displayCanvas = document.getElementById("displayCanvas");
        els.imageInfo = document.getElementById("imageInfo");
        els.imageSize = document.getElementById("imageSize");
        els.defectList = document.getElementById("defectList");
        els.cropPreview = document.getElementById("cropPreview");
        els.totalDefects = document.getElementById("totalDefects");
        els.highConfidence = document.getElementById("highConfidence");
        els.resultBanner = document.getElementById("resultBanner");
        els.resultBannerText = document.getElementById("resultBannerText");
        els.modelStatus = document.getElementById("modelStatus");
    }

    function initAnnotator() {
        annotator = new ImageAnnotator.Annotator("displayCanvas");
        window.addEventListener("resize", () => {
            if (annotator) {
                annotator.resize();
            }
        });
    }

    function bindEvents() {
        els.uploadArea.addEventListener("click", () => {
            els.fileInput.click();
        });

        els.fileInput.addEventListener("change", handleFileSelect);

        els.uploadArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            els.uploadArea.classList.add("dragover");
        });

        els.uploadArea.addEventListener("dragleave", () => {
            els.uploadArea.classList.remove("dragover");
        });

        els.uploadArea.addEventListener("drop", (e) => {
            e.preventDefault();
            els.uploadArea.classList.remove("dragover");
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });

        els.thresholdSlider.addEventListener("input", (e) => {
            els.thresholdValue.textContent = parseFloat(e.target.value).toFixed(2);
        });

        els.detectBtn.addEventListener("click", handleDetect);
        els.resetBtn.addEventListener("click", handleReset);

        els.showBoxes.addEventListener("change", (e) => {
            if (annotator) {
                annotator.setShowBoxes(e.target.checked);
            }
        });

        els.showLabels.addEventListener("change", (e) => {
            if (annotator) {
                annotator.setShowLabels(e.target.checked);
            }
        });
    }

    async function checkHealth() {
        try {
            const result = await DefectAPI.healthCheck();
            if (result.model_loaded) {
                els.modelStatus.textContent = "模型就绪";
                els.modelStatus.className = "status-badge status-ready";
            } else {
                els.modelStatus.textContent = "模型未加载";
                els.modelStatus.className = "status-badge status-error";
            }
        } catch (e) {
            els.modelStatus.textContent = "连接失败";
            els.modelStatus.className = "status-badge status-error";
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    }

    function handleFile(file) {
        if (!file.type.startsWith("image/")) {
            alert("请选择图像文件");
            return;
        }

        currentFile = file;

        if (currentImageUrl) {
            URL.revokeObjectURL(currentImageUrl);
        }

        currentImageUrl = URL.createObjectURL(file);

        loadImage(currentImageUrl);

        els.detectBtn.disabled = false;
        resetResults();
    }

    async function loadImage(imageUrl) {
        try {
            els.imagePlaceholder.style.display = "none";
            els.displayCanvas.style.display = "block";

            const size = await annotator.loadImage(imageUrl);

            els.imageInfo.style.display = "block";
            els.imageSize.textContent = `原始尺寸: ${size.width} × ${size.height} px`;
        } catch (e) {
            alert("图像加载失败: " + e.message);
        }
    }

    async function handleDetect() {
        if (!currentFile || isDetecting) return;

        isDetecting = true;
        els.detectBtn.disabled = true;

        showLoading();

        try {
            const threshold = parseFloat(els.thresholdSlider.value);
            const result = await DefectAPI.detect(currentFile, threshold);

            if (result.success) {
                currentResult = result.data;

                if (result.image_url) {
                    await annotator.loadImage(result.image_url);
                }

                annotator.setDefects(currentResult.defects);
                updateStats(currentResult);
                renderDefectList(currentResult.defects);
            } else {
                    alert("检测失败: " + result.message);
                }
        } catch (e) {
            alert("检测失败: " + e.message);
        } finally {
            isDetecting = false;
            els.detectBtn.disabled = false;
            hideLoading();
        }
    }

    function updateStats(result) {
        const defects = result.defects || [];
        const highCount = defects.filter(d => d.confidence >= WARNING_THRESHOLD).length;

        els.totalDefects.textContent = defects.length;
        els.highConfidence.textContent = highCount;

        els.resultBanner.style.display = "block";

        if (defects.length === 0) {
            els.resultBanner.className = "result-banner success";
            els.resultBannerText.textContent = "✓ 未检测到缺陷，零件合格";
        } else if (highCount > 0) {
            els.resultBanner.className = "result-banner warning";
            els.resultBannerText.textContent = `⚠ 检测到 ${defects.length} 处缺陷，其中 ${highCount} 处高置信度`;
        } else {
            els.resultBanner.className = "result-banner warning";
            els.resultBannerText.textContent = `⚠ 检测到 ${defects.length} 处缺陷`;
        }
    }

    function renderDefectList(defects) {
        if (!defects || defects.length === 0) {
            els.defectList.innerHTML = '<div class="empty-state"><p>未检测到缺陷</p></div>';
            return;
        }

        const html = defects.map(defect => {
            const isHigh = defect.confidence >= WARNING_THRESHOLD;
            const badgeClass = isHigh ? "high" : (defect.confidence >= 0.6 ? "medium" : "");
            const confidencePercent = (defect.confidence * 100).toFixed(1);
            const className = defect.class_name.replace(/_/g, " ");

            return `
                <div class="defect-item ${isHigh ? 'high-confidence' : ''}" data-id="${defect.id}">
                    <div class="defect-header">
                        <span class="defect-name">${className}</span>
                        <span class="defect-badge ${badgeClass}">${confidencePercent}%</span>
                    </div>
                    <div class="defect-meta">ID: ${defect.id}</div>
                    <div class="defect-coords">
                        [${defect.bbox.x1}, ${defect.bbox.y1}, ${defect.bbox.x2}, ${defect.bbox.y2}]
                    </div>
                </div>
            `;
        }).join("");

        els.defectList.innerHTML = html;

        els.defectList.querySelectorAll(".defect-item").forEach(item => {
            item.addEventListener("click", () => {
                const id = parseInt(item.dataset.id);
                handleDefectClick(id, item);
            });
        });
    }

    function handleDefectClick(id, itemEl) {
        els.defectList.querySelectorAll(".defect-item").forEach(el => {
            el.classList.remove("selected");
        });
        itemEl.classList.add("selected");

        annotator.setSelectedDefect(id);

        const defect = currentResult.defects.find(d => d.id === id);
        if (defect) {
            showCropPreview(defect);
        }
    }

    function showCropPreview(defect) {
        const cropCanvas = annotator.cropDefect(defect);
        if (cropCanvas) {
            els.cropPreview.innerHTML = "";
            els.cropPreview.appendChild(cropCanvas);
        }
    }

    function resetResults() {
        currentResult = null;
        if (annotator) {
            annotator.setDefects([]);
            annotator.setSelectedDefect(null);
        }

        els.totalDefects.textContent = "0";
        els.highConfidence.textContent = "0";
        els.resultBanner.style.display = "none";
        els.defectList.innerHTML = '<div class="empty-state"><p>暂无检测结果</p></div>';
        els.cropPreview.innerHTML = '<div class="empty-state"><p>选择缺陷查看裁剪图</p></div>';
    }

    function handleReset() {
        if (currentImageUrl) {
            URL.revokeObjectURL(currentImageUrl);
            currentImageUrl = null;
        }

        currentFile = null;
        currentResult = null;

        if (annotator) {
            annotator.image = null;
            annotator.defects = [];
        }

        els.imagePlaceholder.style.display = "flex";
        els.displayCanvas.style.display = "none";
        els.imageInfo.style.display = "none";
        els.detectBtn.disabled = true;

        els.fileInput.value = "";

        resetResults();
    }

    function showLoading() {
        const container = document.getElementById("imageContainer");
        const overlay = document.createElement("div");
        overlay.className = "loading-overlay";
        overlay.id = "loadingOverlay";
        overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">正在检测中...</div>
        `;
        container.appendChild(overlay);
    }

    function hideLoading() {
        const overlay = document.getElementById("loadingOverlay");
        if (overlay) {
            overlay.remove();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
