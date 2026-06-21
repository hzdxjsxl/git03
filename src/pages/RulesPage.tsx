import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronRight, AlertTriangle, AlertCircle, Shield, Info, BookOpen, FileText, Scale, Gavel } from 'lucide-react';
import { fetchRules, fetchCategories } from '../services/rulesApi';
import type { RiskRule, RiskLevel } from '../types';
import { cn } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';

const levelConfig: Record<RiskLevel, { icon: typeof AlertTriangle; color: string; bgColor: string; borderColor: string; label: string }> = {
  high: { icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500', label: '高风险' },
  medium: { icon: AlertCircle, color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500', label: '中风险' },
  low: { icon: Shield, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500', label: '低风险' },
  info: { icon: Info, color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500', label: '提示' },
};

const levelFilters: Array<{ value: RiskLevel | 'all'; label: string }> = [
  { value: 'all', label: '全部等级' },
  { value: 'high', label: '高风险' },
  { value: 'medium', label: '中风险' },
  { value: 'low', label: '低风险' },
  { value: 'info', label: '提示' },
];

interface RuleWithCategory extends RiskRule {
  expanded?: boolean;
}

const mockCategories = [
  '合同效力',
  '违约责任',
  '争议解决',
  '付款条款',
  '交付条款',
  '保密条款',
  '知识产权',
  '其他',
];

const mockRules: RiskRule[] = [
  {
    id: 'rule-001',
    name: '单方解除合同条款',
    description: '合同中存在一方可单方解除合同且不承担违约责任的条款，可能严重损害另一方权益。',
    level: 'high',
    patterns: ['单方解除', '有权解除', '不承担任何责任', '概不负责'],
    category: '违约责任',
    severity: 9,
  },
  {
    id: 'rule-002',
    name: '违约金过高条款',
    description: '约定的违约金比例超过合理范围，可能被法院认定为过高而予以调整。',
    level: 'medium',
    patterns: ['违约金', '日万分之五', '日千分之', '总金额的[0-9]+%'],
    category: '违约责任',
    severity: 7,
  },
  {
    id: 'rule-003',
    name: '管辖法院不利条款',
    description: '争议解决条款约定的管辖法院对己方明显不利，增加诉讼成本和风险。',
    level: 'high',
    patterns: ['甲方所在地', '原告所在地', '被告所在地', '由.*法院管辖'],
    category: '争议解决',
    severity: 8,
  },
  {
    id: 'rule-004',
    name: '定金罚则条款',
    description: '存在定金条款，需注意定金金额不得超过主合同标的额的20%。',
    level: 'medium',
    patterns: ['定金', '定金罚则', '双倍返还'],
    category: '付款条款',
    severity: 6,
  },
  {
    id: 'rule-005',
    name: '付款时间不明确',
    description: '付款时间约定模糊，可能导致收款方无法及时主张权利。',
    level: 'low',
    patterns: ['尽快支付', '及时付款', '双方协商确定'],
    category: '付款条款',
    severity: 4,
  },
  {
    id: 'rule-006',
    name: '质量标准不明确',
    description: '质量验收标准约定不明确，可能导致履行争议。',
    level: 'medium',
    patterns: ['符合国家标准', '行业标准', '双方另行约定'],
    category: '交付条款',
    severity: 5,
  },
  {
    id: 'rule-007',
    name: '保密期限过长',
    description: '保密义务期限超过合理范围，可能不合理地限制一方的经营自由。',
    level: 'low',
    patterns: ['永久保密', '长期保密', '无限期保密'],
    category: '保密条款',
    severity: 3,
  },
  {
    id: 'rule-008',
    name: '知识产权归属不清',
    description: '合作产生的知识产权归属约定不明确，可能引发后续权属争议。',
    level: 'high',
    patterns: ['知识产权归', '双方共有', '另行协商'],
    category: '知识产权',
    severity: 8,
  },
  {
    id: 'rule-009',
    name: '不可抗力条款缺失',
    description: '合同中未约定不可抗力条款，发生不可抗力事件时可能适用法定条款。',
    level: 'info',
    patterns: ['不可抗力'],
    category: '其他',
    severity: 2,
  },
  {
    id: 'rule-010',
    name: '通知与送达条款',
    description: '建议明确约定通知方式和送达地址，避免因送达问题产生争议。',
    level: 'info',
    patterns: ['书面通知', '送达地址', '通讯方式'],
    category: '其他',
    severity: 1,
  },
];

export default function RulesPage() {
  const [rules, setRules] = useState<RuleWithCategory[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<RiskLevel | 'all'>('all');
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [fetchedRules, fetchedCategories] = await Promise.all([
          fetchRules(),
          fetchCategories(),
        ]);
        setRules(fetchedRules.length > 0 ? fetchedRules : mockRules);
        setCategories(fetchedCategories.length > 0 ? fetchedCategories : mockCategories);
      } catch (error) {
        console.error('Failed to load rules:', error);
        setRules(mockRules);
        setCategories(mockCategories);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredRules = rules.filter((rule) => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || rule.category === selectedCategory;
    const matchesLevel = levelFilter === 'all' || rule.level === levelFilter;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const rulesByCategory = filteredRules.reduce((acc, rule) => {
    const category = rule.category || '其他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(rule);
    return acc;
  }, {} as Record<string, RuleWithCategory[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="正在加载规则库..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            风险规则库
          </h1>
          <p className="text-slate-400">查看和管理合同风险分析规则</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">筛选条件</h3>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  风险等级
                </label>
                <div className="space-y-1">
                  {levelFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setLevelFilter(filter.value)}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm rounded-lg transition-all',
                        levelFilter === filter.value
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  分类
                </label>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm rounded-lg transition-all flex items-center justify-between',
                      selectedCategory === null
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    )}
                  >
                    <span>全部分类</span>
                    <span className="text-xs opacity-70">{filteredRules.length}</span>
                  </button>
                  {categories.map((category) => {
                    const count = rules.filter(
                      (r) => r.category === category &&
                        (levelFilter === 'all' || r.level === levelFilter)
                    ).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm rounded-lg transition-all flex items-center justify-between',
                          selectedCategory === category
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:bg-slate-700'
                        )}
                      >
                        <span>{category}</span>
                        <span className="text-xs opacity-70">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索规则名称或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {Object.entries(rulesByCategory).length === 0 ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
                <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">暂无匹配的规则</h3>
                <p className="text-slate-400">尝试调整筛选条件或搜索关键词</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(rulesByCategory).map(([category, categoryRules]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-4">
                      <Gavel className="w-5 h-5 text-blue-400" />
                      <h2 className="text-lg font-semibold text-white">{category}</h2>
                      <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded-full">
                        {categoryRules.length} 条规则
                      </span>
                    </div>
                    <div className="space-y-3">
                      {categoryRules.map((rule) => {
                        const config = levelConfig[rule.level];
                        const Icon = config.icon;
                        const isExpanded = expandedRule === rule.id;

                        return (
                          <div
                            key={rule.id}
                            className={cn(
                              'bg-slate-800 rounded-xl border border-slate-700 overflow-hidden transition-all duration-300 cursor-pointer group',
                              'hover:border-slate-500 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5'
                            )}
                            onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                          >
                            <div className="flex items-stretch">
                              <div className={cn('w-1.5 flex-shrink-0', config.bgColor.replace('/20', ''))} />
                              <div className="flex-1 p-5">
                                <div className="flex items-start gap-4">
                                  <div className={cn('p-3 rounded-xl flex-shrink-0', config.bgColor)}>
                                    <Icon className={cn('w-6 h-6', config.color)} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                        {rule.name}
                                      </h3>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={cn(
                                          'px-2.5 py-1 rounded-lg text-xs font-medium',
                                          config.bgColor,
                                          config.color
                                        )}>
                                          {config.label}
                                        </span>
                                        {isExpanded ? (
                                          <ChevronDown className="w-5 h-5 text-slate-400" />
                                        ) : (
                                          <ChevronRight className="w-5 h-5 text-slate-400" />
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-3">
                                      {rule.description}
                                    </p>
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <span className="px-2.5 py-1 bg-slate-700 text-slate-300 text-xs rounded-lg">
                                        {rule.category}
                                      </span>
                                      {rule.severity !== undefined && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-slate-500">严重程度</span>
                                          <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                              className={cn('h-full rounded-full', config.bgColor.replace('/20', ''))}
                                              style={{ width: `${(rule.severity / 10) * 100}%` }}
                                            />
                                          </div>
                                          <span className={cn('text-xs font-medium', config.color)}>
                                            {rule.severity}/10
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {isExpanded && (
                                      <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
                                        <div>
                                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                            匹配模式
                                          </h4>
                                          <div className="flex flex-wrap gap-2">
                                            {rule.patterns.map((pattern, index) => (
                                              <code
                                                key={index}
                                                className="px-2.5 py-1.5 bg-slate-900 text-slate-300 text-xs rounded-lg font-mono border border-slate-600"
                                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                              >
                                                {pattern}
                                              </code>
                                            ))}
                                          </div>
                                        </div>

                                        <div>
                                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                            处置建议
                                          </h4>
                                          <div className="p-3 bg-slate-900/50 rounded-lg">
                                            <ul className="text-sm text-slate-300 space-y-1.5">
                                              <li className="flex items-start gap-2">
                                                <span className="text-blue-400 mt-0.5">•</span>
                                                <span>建议与对方协商修改该条款，明确双方权利义务对等。</span>
                                              </li>
                                              <li className="flex items-start gap-2">
                                                <span className="text-blue-400 mt-0.5">•</span>
                                                <span>如对方坚持保留此条款，需评估风险敞口并考虑相应对价。</span>
                                              </li>
                                              <li className="flex items-start gap-2">
                                                <span className="text-blue-400 mt-0.5">•</span>
                                                <span>重要合同建议咨询专业法律人士后再签署。</span>
                                              </li>
                                            </ul>
                                          </div>
                                        </div>

                                        <div>
                                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                            相关法规
                                          </h4>
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2 p-2.5 bg-slate-900/50 rounded-lg">
                                              <Scale className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                              <div>
                                                <p className="text-sm text-white font-medium">《中华人民共和国民法典》</p>
                                                <p className="text-xs text-slate-400">第五百零二条、第五百七十七条、第五百八十四条</p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
