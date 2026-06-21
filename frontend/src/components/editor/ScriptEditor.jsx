import React, { useState } from 'react';
import { useComicStore } from '../../store/comicStore.js';
import './ScriptEditor.css';

const SAMPLE_SCRIPTS = [
  {
    name: '示例剧本：黄昏咖啡馆',
    content: `第1场：街角咖啡馆 · 黄昏
【场景描述】夕阳透过落地窗，金色的光洒在木质桌椅上，空气中飘着咖啡香。

【小樱】: 你终于来了，我等你好久了。
(小樱笑着挥手，手里的拿铁冒着热气)

【小晨】: 抱歉抱歉，路上堵车了。这是你要的资料。
(小晨坐下，从包里掏出一个信封递过去)

【旁白】: 窗外的天渐渐暗了下来，霓虹灯一盏盏亮起。

【小樱】: 太好了！这次真的太感谢你了，我都不知道该怎么报答。
(小樱的眼睛亮了起来，双手接过信封)

【小晨】: 不用客气，下次请我喝杯咖啡就好。
(小晨笑着挠了挠头，目光落在窗外)

第2场：咖啡馆门口 · 夜晚
【场景描述】两人走出咖啡馆，街上人来人往，路灯把影子拉得很长。

【小樱】: 对了，下周的生日聚会你会来吧？
(小樱突然停下脚步，转过头期待地看着小晨)

【小晨】: 啊...我差点忘了！当然会去，礼物都准备好了。
(小晨拍了拍脑袋，露出安心的笑容)`
  },
  {
    name: '示例剧本：冒险出发',
    content: `--- 第一章：启程 ---
【场景描述】山脚下的小村庄，清晨的薄雾还没散去，鸟儿在枝头歌唱。

【艾伦】: 爷爷，这就是传说中的勇者之剑吗？
(艾伦双手颤抖着接过一把锈迹斑斑的古剑)

【爷爷】: 是的，它在等一个真正配得上它的人。现在，是时候了。
(爷爷苍老的眼中闪着泪光，拍了拍艾伦的肩膀)

(艾伦把剑背在身上，深吸一口气，望向远方的山脉)

【旁白】: 少年不知道，他的命运将在今天彻底改变。

【艾伦】: 我走了，爷爷！等我回来！
(艾伦向爷爷深深一鞠躬，转身踏上了蜿蜒的山路)

--- 山间小路 · 正午 ---
(烈日当空，艾伦满头大汗地走在崎岖的山路上)

【艾伦】: 呼...呼...比想象中难走多了。
(艾伦靠在一棵大树下休息，拿出水壶喝了一口水)

(突然，树丛中传来窸窸窣窣的声音)

【神秘声音】: 站住！此树是我栽，此路是我开！
(一个戴着面具的小个子从树丛里跳了出来，手里举着一根木棍)`
  }
];

export default function ScriptEditor() {
  const { rawScript, setRawScript, setActiveTab } = useComicStore();
  const [showSamples, setShowSamples] = useState(false);
  const [charCount, setCharCount] = useState(rawScript.length);
  const [lineCount, setLineCount] = useState(rawScript.split('\n').length);

  const handleChange = (e) => {
    const val = e.target.value;
    setRawScript(val);
    setCharCount(val.length);
    setLineCount(val.split('\n').length);
  };

  const loadSample = (content) => {
    setRawScript(content);
    setCharCount(content.length);
    setLineCount(content.split('\n').length);
    setShowSamples(false);
  };

  return (
    <div className="script-editor-page">
      <div className="editor-main">
        <div className="editor-toolbar">
          <div className="toolbar-left">
            <h2 className="section-title">📝 剧本编辑器</h2>
            <span className="badge badge-accent">{lineCount} 行</span>
            <span className="badge">{charCount} 字</span>
          </div>
          <div className="toolbar-right">
            <div className="sample-dropdown">
              <button
                className="btn btn-sm"
                onClick={() => setShowSamples(!showSamples)}
              >
                📚 加载示例剧本
              </button>
              {showSamples && (
                <div className="sample-menu">
                  {SAMPLE_SCRIPTS.map((s, i) => (
                    <button
                      key={i}
                      className="sample-item"
                      onClick={() => loadSample(s.content)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => { setRawScript(''); setCharCount(0); setLineCount(1); }}
            >
              🗑 清空
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setActiveTab('workspace')}
              disabled={!rawScript.trim()}
            >
              前往工作台 →
            </button>
          </div>
        </div>

        <div className="editor-content">
          <textarea
            className="script-textarea"
            value={rawScript}
            onChange={handleChange}
            placeholder={`请输入你的剧本...

支持的格式：
【角色名】: 对话内容
旁白: 叙述性文字
(动作描述) 或 [动作描述]
用"第X场"或"---"分隔场景

示例：
第1场：森林入口 · 清晨
【场景描述】晨光穿过树叶，地上布满露珠。
【小明】: 今天一定要找到传说中的宝藏！
(小明握紧拳头，眼中闪着坚定的光)`}
            spellCheck={false}
          />
        </div>
      </div>

      <aside className="editor-sidebar">
        <div className="panel syntax-help">
          <div className="panel-header">
            <span>📖 语法速查</span>
          </div>
          <div className="panel-body">
            <div className="syntax-item">
              <code>第X场：标题</code>
              <span>场景分隔符</span>
            </div>
            <div className="syntax-item">
              <code>--- 标题 ---</code>
              <span>另一种场景分隔</span>
            </div>
            <div className="syntax-item">
              <code>【角色】: 台词</code>
              <span>角色对话</span>
            </div>
            <div className="syntax-item">
              <code>旁白: 文字</code>
              <span>旁白叙述</span>
            </div>
            <div className="syntax-item">
              <code>(动作)</code>
              <span>动作/表情描述</span>
            </div>
            <div className="syntax-item">
              <code>【场景描述】</code>
              <span>画面提示词</span>
            </div>
          </div>
        </div>

        <div className="panel style-preview">
          <div className="panel-header">
            <span>🎨 生成设置预览</span>
          </div>
          <div className="panel-body">
            <div className="preview-grid">
              <StyleCard title="日式漫画" emoji="🗾" desc="黑白线条，网点纸效果" />
              <StyleCard title="动画风" emoji="🎬" desc="色彩鲜艳，光影丰富" />
              <StyleCard title="素描" emoji="✏️" desc="铅笔手绘，艺术质感" />
              <StyleCard title="写实" emoji="📷" desc="照片级真实感" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function StyleCard({ title, emoji, desc }) {
  return (
    <div className="style-card">
      <div className="style-emoji">{emoji}</div>
      <div className="style-info">
        <div className="style-name">{title}</div>
        <div className="style-desc">{desc}</div>
      </div>
    </div>
  );
}
