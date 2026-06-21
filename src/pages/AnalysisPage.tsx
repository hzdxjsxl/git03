import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Eye, EyeOff, AlertTriangle, FileText } from 'lucide-react';
import { useContractStore } from '../store/useContractStore';
import { fetchRules } from '../services/rulesApi';
import { segmentContract } from '../core/textSegmenter';
import { calculateHighlights } from '../core/riskHighlighter';
import ContractViewer from '../components/ContractViewer';
import RiskPanel from '../components/RiskPanel';
import RiskTooltip from '../components/RiskTooltip';
import LoadingSpinner from '../components/LoadingSpinner';
import type { RiskMatch, RiskLevel } from '../types';
import { cn } from '../lib/utils';

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

  const [viewMode, setViewMode] = useState<'highlight' | 'text'>('highlight');
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
        const fetchedRules = await fetchRules();
        setRules(fetchedRules);

        const segments = segmentContract(contractText);
        const result = calculateHighlights(segments, fetchedRules);

        setAnalysisResult({
          segments,
          highlights: result.highlights,
          matches: result.matches,
          stats: result.stats,
        });
      } catch (error) {
        console.error('Analysis failed:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!analysisResult || rules.length === 0) {
      runAnalysis();
    }
  }, [contractText, analysisResult, rules.length, navigate, setRules, setAnalysisResult, setLoading]);

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
        matchedText: m.matchedText,
        severity: m.rule.severity,
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
        <div className="flex items-center justify-between">
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
                  共发现 <span className="text-blue-400 font-medium">{analysisResult.stats.totalMatches}</span> 项潜在风险
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
                <Eye className="w-4 h-4" />
                高亮视图
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
          <div className="lg:col-span-7 h-full">
            <ContractViewer
              contractText={contractText}
              highlights={analysisResult.highlights}
              viewMode={viewMode}
              scrollToMatch={selectedMatch}
              onHighlightClick={handleHighlightClick}
            />
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
