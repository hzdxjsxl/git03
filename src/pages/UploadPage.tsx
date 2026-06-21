import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, ClipboardPaste, Trash2, Play, BookOpen, AlertTriangle } from 'lucide-react';
import { useContractStore } from '../store/useContractStore';
import { cn } from '../lib/utils';

const contractTypes = [
  { value: 'sale', label: '买卖合同' },
  { value: 'lease', label: '租赁合同' },
  { value: 'labor', label: '劳动合同' },
  { value: 'service', label: '服务合同' },
  { value: 'other', label: '其他' },
];

const sensitivityLevels = [
  { value: 'low', label: '低', color: 'bg-green-500' },
  { value: 'medium', label: '中', color: 'bg-yellow-500' },
  { value: 'high', label: '高', color: 'bg-red-500' },
];

const sampleContract = `买卖合同

甲方（卖方）：XX科技有限公司
法定代表人：张三
地址：北京市朝阳区XX路XX号

乙方（买方）：YY贸易有限公司
法定代表人：李四
地址：上海市浦东新区XX路XX号

根据《中华人民共和国民法典》及相关法律法规，甲乙双方本着平等、自愿、公平的原则，经协商一致，签订本合同。

第一条 产品名称、数量、价格
1.1 甲方向乙方出售以下产品：
    - 电子产品：1000台，单价5000元/台
    - 配件：2000套，单价200元/套
1.2 合同总金额：人民币5,400,000元整（大写：伍佰肆拾万元整）

第二条 付款方式
2.1 乙方应在合同签订后3个工作日内支付合同总金额的30%作为定金，即人民币1,620,000元。
2.2 剩余70%货款，即人民币3,780,000元，乙方应在收到全部货物并验收合格后10个工作日内支付。
2.3 如乙方逾期付款，应按日万分之五支付违约金。甲方有权单方解除合同，且不承担任何责任。

第三条 交货时间与地点
3.1 交货时间：合同签订后30日内。
3.2 交货地点：乙方仓库（上海市浦东新区XX路XX号）。
3.3 运输费用由甲方承担。

第四条 质量标准与验收
4.1 产品质量应符合国家标准及行业标准。
4.2 乙方应在收到货物后5个工作日内完成验收。
4.3 如发现产品质量问题，乙方应在验收期内书面通知甲方，甲方应在7个工作日内更换或退货。

第五条 违约责任
5.1 任何一方违反本合同约定，应承担违约责任。
5.2 甲方逾期交货的，应按日向乙方支付合同总金额万分之三的违约金。
5.3 乙方违反本合同约定，甲方有权终止合同，所有已付款项不予退还。

第六条 争议解决
6.1 因本合同发生的争议，双方应协商解决。
6.2 协商不成的，任何一方有权向甲方所在地人民法院提起诉讼。

第七条 其他条款
7.1 本合同自双方签字盖章之日起生效。
7.2 本合同一式两份，甲乙双方各执一份，具有同等法律效力。

甲方（盖章）：                    乙方（盖章）：
法定代表人（签字）：              法定代表人（签字）：
日期：2024年1月1日                日期：2024年1月1日`;

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { contractText, setContractText, clearAll } = useContractStore();

  const [isDragging, setIsDragging] = useState(false);
  const [contractType, setContractType] = useState('sale');
  const [sensitivity, setSensitivity] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback((file: File) => {
    const validTypes = ['.txt', '.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      alert('请上传 .txt, .pdf, .doc, .docx 格式的文件');
      return;
    }

    setFileName(file.name);

    if (file.type === 'text/plain' || fileExtension === '.txt') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setContractText(content);
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setContractText(`[${file.name}]\n\n（PDF/Word 文件内容需后端解析，此处模拟已读取文件内容）\n\n请粘贴合同文本到右侧区域，或使用文本格式文件。`);
      };
      reader.readAsDataURL(file);
    }
  }, [setContractText]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContractText(e.target.value);
  }, [setContractText]);

  const handleLoadSample = useCallback(() => {
    setContractText(sampleContract);
    setFileName('示例合同.txt');
  }, [setContractText]);

  const handleClear = useCallback(() => {
    clearAll();
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [clearAll]);

  const handleAnalyze = useCallback(() => {
    if (!contractText.trim()) {
      alert('请先上传合同文件或粘贴合同文本');
      return;
    }
    navigate('/analysis');
  }, [contractText, navigate]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            合同风险分析
          </h1>
          <p className="text-slate-400">上传合同文件或粘贴文本，智能识别潜在风险</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div
            className={cn(
              'relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer min-h-96 flex flex-col items-center justify-center',
              isDragging
                ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-300',
              isDragging ? 'bg-blue-500/20' : 'bg-slate-700'
            )}>
              <Upload className={cn(
                'w-10 h-10 transition-colors duration-300',
                isDragging ? 'text-blue-400' : 'text-slate-400'
              )} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isDragging ? '释放文件以上传' : '拖拽文件到此处'}
            </h3>
            <p className="text-slate-400 text-center mb-4">
              支持 .txt, .pdf, .doc, .docx 格式
            </p>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
              或点击选择文件
            </button>
            {fileName && (
              <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-lg">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300">{fileName}</span>
              </div>
            )}
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col min-h-96">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardPaste className="w-5 h-5 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">粘贴合同文本</h3>
            </div>
            <div className="flex-1 relative">
              <textarea
                value={contractText}
                onChange={handleTextChange}
                placeholder="在此粘贴合同文本内容..."
                className="w-full h-full min-h-64 bg-slate-900 border border-slate-600 rounded-xl p-4 text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-slate-500">
                字数统计：<span className="text-slate-300 font-medium">{contractText.length}</span> 字
              </p>
              <button
                onClick={handleLoadSample}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all"
              >
                <BookOpen className="w-4 h-4" />
                查看示例
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                合同类型
              </label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                {contractTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                风险敏感度
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="2"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between">
                  {sensitivityLevels.map((level, index) => (
                    <div
                      key={level.value}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all',
                        sensitivity === index
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-500'
                      )}
                    >
                      <div className={cn('w-3 h-3 rounded-full', level.color)} />
                      {level.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-all"
          >
            <Trash2 className="w-5 h-5" />
            清空
          </button>
          <button
            onClick={handleLoadSample}
            className="flex items-center gap-2 px-6 py-3 border border-slate-600 hover:border-slate-500 hover:bg-slate-800 text-slate-300 rounded-xl font-medium transition-all"
          >
            <BookOpen className="w-5 h-5" />
            加载示例合同
          </button>
          <button
            onClick={handleAnalyze}
            disabled={!contractText.trim()}
            className={cn(
              'flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all',
              contractText.trim()
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105'
                : 'bg-slate-700 cursor-not-allowed opacity-50'
            )}
          >
            <Play className="w-5 h-5" />
            开始分析
          </button>
        </div>

        <div className="mt-8 flex items-start justify-center gap-4 text-sm text-slate-500">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            本系统仅提供风险分析参考，不构成法律建议。重要合同请咨询专业法律人士。
          </p>
        </div>
      </div>
    </div>
  );
}
