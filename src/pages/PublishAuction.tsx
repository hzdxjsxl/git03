import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Package, DollarSign, Clock, FileText, ArrowLeft } from 'lucide-react';
import { useAuctionStore } from '../modules/auction/store';
import { useMessageStore } from '../modules/message/store';
import { Link } from 'react-router-dom';

export const PublishAuction = () => {
  const navigate = useNavigate();
  const createAuction = useAuctionStore((state) => state.createAuction);
  const addToast = useMessageStore((state) => state.addToast);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startPrice: 100,
    duration: 60,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      addToast({ type: 'error', title: '请输入商品标题' });
      return;
    }
    
    if (formData.startPrice <= 0) {
      addToast({ type: 'error', title: '起拍价必须大于0' });
      return;
    }

    setIsSubmitting(true);
    const result = await createAuction(formData);
    setIsSubmitting(false);

    if (result) {
      addToast({ type: 'success', title: '发布成功！', message: '您的拍卖商品已上架' });
      navigate(`/auction/${result.id}`);
    } else {
      addToast({ type: 'error', title: '发布失败', message: '请稍后重试' });
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-dark-400 hover:text-primary-400 transition-colors mb-8">
        <ArrowLeft size={20} />
        <span>返回</span>
      </Link>

      <div className="glass-card p-8">
        <h1 className="text-2xl font-bold text-dark-100 mb-8 font-display">发布拍卖</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              <Upload size={16} className="inline mr-2" />
              商品图片
            </label>
            <div className="border-2 border-dashed border-dark-600 rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors cursor-pointer">
              <Package className="mx-auto mb-3 text-dark-500" size={48} />
              <p className="text-dark-400">点击或拖拽上传图片</p>
              <p className="text-dark-600 text-sm mt-1">支持 JPG、PNG 格式（演示使用默认图片）</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              <FileText size={16} className="inline mr-2" />
              商品标题
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请输入商品名称"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              商品描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请详细描述商品的成色、配置、使用情况等信息"
              rows={4}
              className="input-field resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                <DollarSign size={16} className="inline mr-2" />
                起拍价（元）
              </label>
              <input
                type="number"
                value={formData.startPrice}
                onChange={(e) => setFormData({ ...formData, startPrice: Number(e.target.value) })}
                min="1"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                <Clock size={16} className="inline mr-2" />
                拍卖时长
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="input-field"
              >
                <option value={30}>30 分钟</option>
                <option value={60}>1 小时</option>
                <option value={180}>3 小时</option>
                <option value={360}>6 小时</option>
                <option value={720}>12 小时</option>
                <option value={1440}>24 小时</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary"
            >
              {isSubmitting ? '发布中...' : '立即发布'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
