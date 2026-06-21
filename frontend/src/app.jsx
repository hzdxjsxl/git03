import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header.jsx';
import ScriptEditor from './components/editor/ScriptEditor.jsx';
import ComicWorkspace from './components/workspace/ComicWorkspace.jsx';
import LibraryPanel from './components/library/LibraryPanel.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import { useComicStore } from './store/comicStore.js';
import { generateApi, libraryApi } from './services/api.js';
import { runScriptToPanels } from './utils/scriptProcessor.js';
import './styles/app.css';

export default function App() {
  const {
    rawScript,
    layoutStyle,
    comicStyle,
    setParsedScript,
    setPanels,
    setGeneratedPanels,
    setProcessing,
    setError,
    setLibraryData,
    activeTab
  } = useComicStore();

  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [tplRes, catRes] = await Promise.all([
          libraryApi.getTemplates({ limit: 84 }),
          libraryApi.getCategories()
        ]);
        const templates = (tplRes.success && tplRes.data) ? tplRes.data.items || [] : [];
        const categories = (catRes.success && catRes.data) ? (Array.isArray(catRes.data) ? catRes.data : catRes.data.items || []) : [];
        setLibraryData(templates, categories);
      } catch (e) {
        console.warn('加载图库失败:', e.message);
        setLibraryData([], []);
      }
    })();
  }, []);

  const handleGenerate = async () => {
    if (!rawScript.trim()) {
      setError('请先输入剧本文本');
      return;
    }

    setProcessing(true);
    setError(null);
    setProgress(5);
    setProgressText('正在解析剧本...');

    try {
      await new Promise(r => setTimeout(r, 150));
      const { parsedScript, panels } = runScriptToPanels(rawScript, layoutStyle);
      setParsedScript(parsedScript);
      setProgress(20);

      setProgressText(`已拆分 ${panels.length} 个分镜...`);
      await new Promise(r => setTimeout(r, 200));
      setPanels(panels);
      setProgress(40);

      setProgressText(`正在生成 ${panels.length} 张分镜图像...`);
      const batchPayload = panels.map((p, i) => ({
        prompt: p.prompt,
        sceneType: p.sceneType,
        style: comicStyle,
        size: p.suggestedSize || 'standard',
        originalIndex: i
      }));

      const generatedMap = {};
      const batchSize = 3;
      
      for (let i = 0; i < batchPayload.length; i += batchSize) {
        const batch = batchPayload.slice(i, i + batchSize);
        const batchRes = await generateApi.generateBatch(batch, comicStyle);
        batchRes.data.panels.forEach(gen => {
          generatedMap[panels[gen.originalIndex].id] = gen;
        });
        const pct = 40 + Math.floor(55 * Math.min(1, (i + batchSize) / batchPayload.length));
        setProgress(pct);
        setProgressText(`已生成 ${Math.min(i + batchSize, batchPayload.length)} / ${batchPayload.length} 张...`);
      }
      
      setGeneratedPanels(generatedMap);
      setProgress(100);
      setProgressText('生成完成！');
      
      setTimeout(() => {
        setProgress(0);
        setProgressText('');
        setProcessing(false);
      }, 500);

    } catch (err) {
      setError(err.message || '生成失败');
      setProcessing(false);
      setProgress(0);
      setProgressText('');
    }
  };

  return (
    <div className="app-root">
      <Header
        onGenerate={handleGenerate}
        progress={progress}
        progressText={progressText}
      />
      
      <div className="app-body">
        <Sidebar />
        
        <main className="app-main">
          {activeTab === 'editor' && <ScriptEditor />}
          {activeTab === 'workspace' && <ComicWorkspace />}
          {activeTab === 'library' && <LibraryPanel />}
        </main>
      </div>
    </div>
  );
}
