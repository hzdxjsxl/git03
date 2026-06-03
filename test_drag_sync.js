console.log('=== 拖拽状态同步测试 ===\n');

function simulateDragTest() {
    class MockHeatmap {
        constructor() {
            this.viewX = 0;
            this.viewY = 0;
            this.scale = 1.0;
            this.isDragging = false;
            this.lastMouseX = 0;
            this.lastMouseY = 0;
            this.tilesLoaded = 0;
            this.tilesTotal = 0;
            this.panelUpdates = 0;
        }
        
        getCurrentLevel() {
            return 2;
        }
        
        updateInfoPanel() {
            this.panelUpdates++;
            const level = this.getCurrentLevel();
            console.log(`[面板更新 #${this.panelUpdates}] 层级=${level}, 缩放=${(this.scale*100).toFixed(1)}%, 位置=(${Math.floor(this.viewX)}, ${Math.floor(this.viewY)}), 瓦片=${this.tilesLoaded}/${this.tilesTotal}`);
        }
        
        onMouseDown(e) {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            console.log(`[鼠标按下] isDragging=${this.isDragging}, lastMouse=(${this.lastMouseX}, ${this.lastMouseY})`);
        }
        
        onMouseMove(e) {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.viewX -= dx / this.scale;
                this.viewY -= dy / this.scale;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                console.log(`[拖拽移动] dx=${dx}, dy=${dy}, view=(${this.viewX.toFixed(1)}, ${this.viewY.toFixed(1)})`);
                this.updateInfoPanel();
            }
        }
        
        onMouseUp() {
            this.isDragging = false;
            console.log(`[鼠标释放] isDragging=${this.isDragging}`);
        }
    }
    
    const heatmap = new MockHeatmap();
    
    console.log('初始状态:');
    heatmap.updateInfoPanel();
    
    console.log('\n--- 开始拖拽模拟 ---');
    
    heatmap.onMouseDown({ clientX: 500, clientY: 400 });
    
    for (let i = 1; i <= 5; i++) {
        heatmap.onMouseMove({ clientX: 500 + i * 20, clientY: 400 + i * 15 });
    }
    
    heatmap.onMouseUp();
    
    console.log('\n--- 拖拽结束 ---');
    console.log(`\n最终状态: 视口位置=(${Math.floor(heatmap.viewX)}, ${Math.floor(heatmap.viewY)})`);
    console.log(`面板更新次数: ${heatmap.panelUpdates} (期望: 6 = 1初始 + 5拖拽)`);
    
    if (heatmap.panelUpdates === 6 && heatmap.viewX === -100 && heatmap.viewY === -75) {
        console.log('\n✅ 测试通过！拖拽时面板实时更新');
    } else {
        console.log('\n❌ 测试失败！');
        console.log(`  期望: viewX=-100, viewY=-75, panelUpdates=6`);
        console.log(`  实际: viewX=${heatmap.viewX}, viewY=${heatmap.viewY}, panelUpdates=${heatmap.panelUpdates}`);
    }
    
    return heatmap.panelUpdates === 6;
}

simulateDragTest();
