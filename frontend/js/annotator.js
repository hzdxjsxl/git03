/**
 * 图像标注组件
 * 负责：
 *   - 图像加载与显示
 *   - 检测框自适应缩放（原始像素坐标 -> 画布显示坐标转换）
 *   - 缺陷标签渲染
 *   - 高置信度警告标红
 *   - 缺陷区域裁剪
 *   完全解耦：只负责画布渲染，不掺杂业务逻辑
 */

const ImageAnnotator = (function () {
    const DEFECT_COLORS = {
        scratch: "#ef4444",
        dent: "#f59e0b",
        stain: "#8b5cf6",
        crack: "#ec4899",
        missing_part: "#06b6d4",
        rust: "#84cc16"
    };

    const DEFAULT_COLOR = "#ef4444";
    const WARNING_THRESHOLD = 0.8;
    const BOX_LINE_WIDTH = 2;
    const BOX_LINE_WIDTH_WARNING = 3;
    const LABEL_FONT = "bold 12px sans-serif";

    class Annotator {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            this.ctx = this.canvas.getContext("2d");
            this.image = null;
            this.defects = [];
            this.showBoxes = true;
            this.showLabels = true;
            this.selectedDefectId = null;
            this.scale = 1;
            this.offsetX = 0;
            this.offsetY = 0;
            this._displayWidth = 0;
            this._displayHeight = 0;
            this._onDefectClick = null;
        }

        onDefectClick(callback) {
            this._onDefectClick = callback;
        }

        async loadImage(imageUrl) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.image = img;
                    this._fitCanvasSize();
                    this.render();
                    resolve({
                        width: img.naturalWidth,
                        height: img.naturalHeight
                    });
                };
                img.onerror = () => {
                    reject(new Error("图像加载失败"));
                };
                img.src = imageUrl;
            });
        }

        setDefects(defects) {
            this.defects = defects || [];
            this.selectedDefectId = null;
            this.render();
        }

        setShowBoxes(show) {
            this.showBoxes = show;
            this.render();
        }

        setShowLabels(show) {
            this.showLabels = show;
            this.render();
        }

        setSelectedDefect(id) {
            this.selectedDefectId = id;
            this.render();
        }

        _fitCanvasSize() {
            if (!this.image) return;

            const container = this.canvas.parentElement;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            const imgRatio = this.image.naturalWidth / this.image.naturalHeight;
            const containerRatio = containerWidth / containerHeight;

            if (imgRatio > containerRatio) {
                this._displayWidth = containerWidth;
                this._displayHeight = containerWidth / imgRatio;
            } else {
                this._displayHeight = containerHeight;
                this._displayWidth = containerHeight * imgRatio;
            }

            this.canvas.width = this._displayWidth;
            this.canvas.height = this._displayHeight;

            this.scale = this._displayWidth / this.image.naturalWidth;
            this.offsetX = 0;
            this.offsetY = 0;
        }

        _toCanvasCoords(bbox) {
            return {
                x1: bbox.x1 * this.scale + this.offsetX,
                y1: bbox.y1 * this.scale + this.offsetY,
                x2: bbox.x2 * this.scale + this.offsetX,
                y2: bbox.y2 * this.scale + this.offsetY
            };
        }

        _getDefectColor(defect) {
            return DEFECT_COLORS[defect.class_name] || DEFAULT_COLOR;
        }

        _isWarning(defect) {
            return defect.confidence >= WARNING_THRESHOLD;
        }

        render() {
            if (!this.ctx || !this.image) return;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.drawImage(
                this.image,
                this.offsetX,
                this.offsetY,
                this._displayWidth,
                this._displayHeight
            );

            if (this.showBoxes && this.defects.length > 0) {
                this.defects.forEach(defect => {
                    this._drawDefectBox(defect);
                });
            }
        }

        _drawDefectBox(defect) {
            const coords = this._toCanvasCoords(defect.bbox);
            const isWarning = this._isWarning(defect);
            const isSelected = this.selectedDefectId === defect.id;
            const color = this._getDefectColor(defect);

            const lineWidth = isWarning ? BOX_LINE_WIDTH_WARNING : BOX_LINE_WIDTH;

            if (isWarning) {
                this.ctx.shadowColor = color;
                this.ctx.shadowBlur = 8;
            }

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = lineWidth;
            this.ctx.strokeRect(
                coords.x1,
                coords.y1,
                coords.x2 - coords.x1,
                coords.y2 - coords.y1
            );

            this.ctx.shadowBlur = 0;

            if (isSelected) {
                this.ctx.strokeStyle = "#ffffff";
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([4, 4]);
                this.ctx.strokeRect(
                    coords.x1 - 2,
                    coords.y1 - 2,
                    coords.x2 - coords.x1 + 4,
                    coords.y2 - coords.y1 + 4
                );
                this.ctx.setLineDash([]);
            }

            if (this.showLabels) {
                this._drawLabel(defect, coords, color, isWarning);
            }
        }

        _drawLabel(defect, coords, color, isWarning) {
            const labelText = `${defect.class_name} ${(defect.confidence * 100).toFixed(1)}%`;

            this.ctx.font = LABEL_FONT;
            const textMetrics = this.ctx.measureText(labelText);
            const labelWidth = textMetrics.width + 12;
            const labelHeight = 20;

            let labelY = coords.y1 - labelHeight;
            if (labelY < 0) {
                labelY = coords.y1;
            }

            this.ctx.fillStyle = color;
            this.ctx.fillRect(
                coords.x1,
                labelY,
                labelWidth,
                labelHeight
            );

            this.ctx.fillStyle = "#ffffff";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(
                labelText,
                coords.x1 + 6,
                labelY + labelHeight / 2
            );
        }

        cropDefect(defect) {
            if (!this.image) return null;

            const bbox = defect.bbox;
            const width = bbox.x2 - bbox.x1;
            const height = bbox.y2 - bbox.y1;

            const cropCanvas = document.createElement("canvas");
            const padding = Math.min(width, height) * 0.1;
            cropCanvas.width = width + padding * 2;
            cropCanvas.height = height + padding * 2;
            const cropCtx = cropCanvas.getContext("2d");

            cropCtx.drawImage(
                this.image,
                Math.max(0, bbox.x1 - padding),
                Math.max(0, bbox.y1 - padding),
                width + padding * 2,
                height + padding * 2,
                0,
                0,
                cropCanvas.width,
                cropCanvas.height
            );

            const boxX = padding;
            const boxY = padding;
            const isWarning = this._isWarning(defect);
            const color = this._getDefectColor(defect);

            cropCtx.strokeStyle = color;
            cropCtx.lineWidth = isWarning ? 3 : 2;
            if (isWarning) {
                cropCtx.shadowColor = color;
                cropCtx.shadowBlur = 6;
            }
            cropCtx.strokeRect(boxX, boxY, width, height);
            cropCtx.shadowBlur = 0;

            return cropCanvas;
        }

        resize() {
            if (!this.image) return;
            this._fitCanvasSize();
            this.render();
        }

        getImageSize() {
            if (!this.image) return { width: 0, height: 0 };
            return {
                width: this.image.naturalWidth,
                height: this.image.naturalHeight
            };
        }

        static getWarningThreshold() {
            return WARNING_THRESHOLD;
        }

        static getDefectColors() {
            return { ...DEFECT_COLORS };
        }
    }

    return {
        Annotator,
        getWarningThreshold: Annotator.getWarningThreshold,
        getDefectColors: Annotator.getDefectColors
    };
})();
