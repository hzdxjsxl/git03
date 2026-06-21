import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Eye, EyeOff, AlertTriangle, FileText, GitCompare, Sparkles } from 'lucide-react';
import { useContractStore } from '../store/useContractStore';
import { fetchRules, fetchContractTemplate } from '../services/rulesApi';
import { segmentContract } from '../core/textSegmenter';
import { calculateHighlights } from '../core/riskHighlighter';
import { compareWithTemplate, calculateDiffStats } from '../core/textDiff';
import ContractViewer from '../components/ContractViewer';
import RiskPanel from '../components/RiskPanel';
import RiskTooltip from '../components/RiskTooltip';
import DiffViewer from '../components/DiffViewer';
import LoadingSpinner from '../components/LoadingSpinner';
import type { RiskMatch, RiskLevel } from '../types';
import { cn } from '../lib/utils';

type ViewMode = 'highlight' | 'text' | 'diff';

export default function AnalysisPage() {
  const navigate = useNavigate();
  const {
    contractText,
    analysisResult,
    rules,
    loading,
    selectedMatch,
    setRules,
    setAnalysisResult,
    setLoading,
    setSelectedMatch,
  } = useContractStore();

  const [viewMode, setViewMode] = useState<ViewMode>('highlight');
  const [filterLevel, setFilterLevel] = useState<RiskLevel | 'all'>('all');
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!contractText.trim()) {
      navigate('/');
      return;
    }

    const runAnalysis = async () => {
      setLoading(true);
      try {
        const [fetchedRules, template] = await Promise.all([
          fetchRules(),
          fetchContractTemplate(),
        ]);

        setRules(fetchedRules);

        const segments = segmentContract(contractText);
        const highlightResult = calculateHighlights(segments, fetchedRules);

        const diffResults = compareWithTemplate(contractText, template.text);
        const diffStats = calculateDiffStats(diffResults, template.text, contractText);

        setAnalysisResult({
          segments,
          highlights: highlightResult.highlights,
          matches: highlightResult.matches,
          stats: highlightResult.stats,
          diffResults,
          templateName: template.name,
          diffStats,
        });
      } catch (error) {
        console.error('Analysis failed:', error);
        const segments = segmentContract(contractText);
        const fetchedRules = rules.length > 0 ? rules : [];
        const highlightResult = calculateHighlights(segments, fetchedRules);
        setAnalysisResult({
          segments,
          highlights: highlightResult.highlights,
          matches: highlightResult.matches,
          stats: highlightResult.stats,
        });
      } finally {
        setLoading(false);
      }
    };

    if (!analysisResult || rules.length === 0) {
      runAnalysis();
    }
  }, [contractText, analysisResult, rules.length, navigate, setRules, setAnalysisResult, setLoading, rules]);

  const handleHighlightClick = useCallback((match: RiskMatch, event: React.MouseEvent) => {
    setSelectedMatch(match);
    setTooltipPosition({
      x: event.clientX + 10,
      y: event.clientY + 10,
    });
  }, [setSelectedMatch]);

  const handleMatchClick = useCallback((match: RiskMatch) => {
    setSelectedMatch(match);
    setTooltipPosition(null);
    setViewMode('highlight');
  }, [setSelectedMatch]);

  const handleCloseTooltip = useCallback(() => {
    setTooltipPosition(null);
  }, []);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleExport = useCallback(() => {
    if (!analysisResult) return;

    const report = {
      exportTime: new Date().toISOString(),
      contractText,
      templateName: analysisResult.templateName || '未加载模板',
      diffStats: analysisResult.diffStats || null,
      summary: {
        totalMatches: analysisResult.stats.totalMatches,
        totalSegments: analysisResult.stats.totalSegments,
        riskCounts: analysisResult.stats.riskCounts,
        processingTime: analysisResult.stats.processingTime,
      },
      risks: analysisResult.matches.map((m) => ({
        rule: m.rule.name,
        level: m.rule.level,
        description: m.rule.description,
        suggestion: m.rule.suggestion,
        regulation: m.rule.regulation,
        matchedText: m.matchedText,
        category: m.rule.category,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-risk-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analysisResult, contractText]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="正在分析合同，请稍候..." />
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">分析失败</h2>
          <p className="text-slate-400 mb-4">无法完成合同分析，请重试</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            返回上传
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col" onClick={handleCloseTooltip}>
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回上传
            </button>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <div>
                <h1 className="text-lg font-semibold text-white">合同分析结果</h1>
                <p className="text-sm text-slate-400">
                  共发现 <span className="text-red-400 font-bold">{analysisResult.stats.totalMatches}</span> 项潜在风险
                  {analysisResult.diffStats && (
                    <span className="ml-3">
                      · 与模板相似度 <span className="text-blue-400 font-medium">{analysisResult.diffStats.similarity}%</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('highlight')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  viewMode === 'highlight'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <Sparkles className="w-4 h-4" />
                风险高亮
              </button>
              <button
                onClick={() => setViewMode('diff')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  viewMode === 'diff'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                )}
                disabled={!analysisResult.diffResults}
              >
                <GitCompare className="w-4 h-4" />
                差异比对
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  viewMode === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <EyeOff className="w-4 h-4" />
                纯文本
              </button>
            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              导出报告
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-10 gap-6" onClick={(e) => e.stopPropagation()}>
          <div className="lg:col-span-7 h-full flex flex-col">
            {analysisResult.diffStats && viewMode === 'diff' && (
              <div className="mb-4 grid grid-cols-4 gap-3">
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">相似度</p>
                  <p className="text-xl font-bold text-blue-400">{analysisResult.diffStats.similarity}%</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">一致字符</p>
                  <p className="text-xl font-bold text-slate-200">{analysisResult.diffStats.unchangedChars.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">新增字符</p>
                  <p className="text-xl font-bold text-emerald-400">+{analysisResult.diffStats.addedChars.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">缺少字符</p>
                  <p className="text-xl font-bold text-rose-400">-{analysisResult.diffStats.removedChars.toLocaleString()}</p>
                </div>
              </div>
            )}

            <div className="flex-1 min-h-0">
              {viewMode === 'highlight' || viewMode === 'text' ? (
                <ContractViewer
                  contractText={contractText}
                  highlights={viewMode === 'highlight' ? analysisResult.highlights : []}
                  viewMode={viewMode === 'highlight' ? 'highlight' : 'text'}
                  scrollToMatch={selectedMatch}
                  onHighlightClick={handleHighlightClick}
                />
              ) : analysisResult.diffResults ? (
                <DiffViewer diffResults={analysisResult.diffResults} />
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-800 rounded-xl border border-slate-700">
                  <p className="text-slate-400">差异比对不可用</p>
                </div>
              )}
            </div>

            {viewMode === 'diff' && (
              <div className="mt-4 flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 bg-emerald-500/20 border-b-2 border-emerald-500 rounded"></span>
                  <span>合同新增内容</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 bg-rose-500/20 border-b-2 border-rose-500 rounded opacity-75 line-through"></span>
                  <span>模板中存在但合同缺少</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 bg-slate-600/30 rounded"></span>
                  <span>一致内容</span>
                </div>
                {analysisResult.templateName && (
                  <div className="ml-auto">
                    对比模板: <span className="text-slate-300 font-medium">{analysisResult.templateName}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-3 h-full">
            <RiskPanel
              matches={analysisResult.matches}
              stats={analysisResult.stats}
              filterLevel={filterLevel}
              onFilterChange={setFilterLevel}
              onMatchClick={handleMatchClick}
            />
          </div>
        </div>
      </div>

      {tooltipPosition && selectedMatch && (
        <RiskTooltip
          match={selectedMatch}
          position={tooltipPosition}
          onClose={handleCloseTooltip}
        />
      )}
    </div>
  );
}
