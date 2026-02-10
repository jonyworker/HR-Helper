
import React, { useState } from 'react';
import { Participant, Group } from '../types';
import { generateTeamNames } from '../services/geminiService';

interface Props {
  participants: Participant[];
}

type GroupMode = 'numGroups' | 'sizePerGroup';

const TeamSplitter: React.FC<Props> = ({ participants }) => {
  const [mode, setMode] = useState<GroupMode>('numGroups');
  const [value, setValue] = useState<number>(4);
  const [isSplitting, setIsSplitting] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [theme, setTheme] = useState('職場激勵');
  const [useAI, setUseAI] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const toChineseOrdinal = (n: number) => {
    const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    if (n <= 10) return `第${chineseNumbers[n]}組`;
    if (n < 20) return `第十${n % 10 === 0 ? '' : chineseNumbers[n % 10]}組`;
    // Fallback for very large numbers
    return `第 ${n} 組`;
  };

  const shuffle = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const performSplit = async () => {
    if (participants.length === 0) {
      alert('名單為空，無法分組！');
      return;
    }

    setIsSplitting(true);
    
    // Calculate groups
    const shuffled = shuffle(participants);
    let numGroups = 0;
    
    if (mode === 'numGroups') {
      numGroups = Math.max(1, Math.min(value, participants.length));
    } else {
      const size = Math.max(1, value);
      numGroups = Math.ceil(participants.length / size);
    }

    let teamNames: string[] = [];
    if (useAI) {
      // Generate cool team names via Gemini
      teamNames = await generateTeamNames(numGroups, theme);
    } else {
      // Default to standard numbering
      teamNames = Array.from({ length: numGroups }, (_, i) => toChineseOrdinal(i + 1));
    }
    
    const result: Group[] = Array.from({ length: numGroups }, (_, i) => ({
      id: `group-${i}`,
      name: teamNames[i] || toChineseOrdinal(i + 1),
      members: []
    }));

    shuffled.forEach((participant, index) => {
      const groupIndex = index % numGroups;
      result[groupIndex].members.push(participant);
    });

    setGroups(result);
    setIsSplitting(false);
    setEditingGroupId(null);
  };

  const updateGroupName = (id: string, newName: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name: newName } : g));
  };

  const downloadCSV = () => {
    if (groups.length === 0) return;

    let csvContent = "小組名稱,成員姓名\n";
    groups.forEach(group => {
      group.members.forEach(member => {
        csvContent += `"${group.name}","${member.name}"\n`;
      });
    });

    // Use BOM for Excel compatibility with Chinese characters
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `分組結果_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async () => {
    if (groups.length === 0) return;

    let text = "【HR Fun Hub - 分組名單】\n\n";
    groups.forEach(group => {
      const memberNames = group.members.map(m => m.name).join(', ');
      text += `📍 ${group.name} (${group.members.length}人)\n成員：${memberNames}\n\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('複製失敗，請手動選取文字。');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <i className="fa-solid fa-people-group text-indigo-500 mr-2"></i> 分組設定
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">分組模式</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setMode('numGroups')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  mode === 'numGroups' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                固定組數
              </button>
              <button
                onClick={() => setMode('sizePerGroup')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  mode === 'sizePerGroup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                每組人數
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">
              {mode === 'numGroups' ? '組數設定 (組)' : '每組設定 (人)'}
            </label>
            <input
              type="number"
              min="1"
              max={participants.length || 100}
              value={value}
              onChange={(e) => setValue(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-center font-bold text-white"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-600">AI 創意命名</label>
              <button 
                onClick={() => setUseAI(!useAI)}
                className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${useAI ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${useAI ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <input
              type="text"
              value={theme}
              disabled={!useAI}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="輸入主題，例如：創新"
              className={`w-full px-4 py-2 border-2 rounded-xl outline-none text-center transition-all ${
                useAI ? 'border-slate-200 focus:border-indigo-500 bg-white' : 'border-slate-100 bg-slate-50 text-slate-400'
              }`}
            />
          </div>

          <button
            onClick={performSplit}
            disabled={isSplitting || participants.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black transition-all shadow-lg active:scale-95 disabled:bg-slate-300"
          >
            {isSplitting ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <span><i className="fa-solid fa-shuffle mr-2"></i> 立即隨機分組</span>
            )}
          </button>
        </div>
      </div>

      {groups.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-2 gap-4">
            <h3 className="font-bold text-slate-700">分組預覽 (雙擊名稱可修改)</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  copyStatus === 'copied' 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
              >
                <i className={`fa-solid ${copyStatus === 'copied' ? 'fa-check' : 'fa-copy'}`}></i>
                {copyStatus === 'copied' ? '已複製！' : '複製文字名單'}
              </button>
              <button
                onClick={downloadCSV}
                className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-200 transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-download"></i> 下載 CSV 紀錄
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, idx) => (
              <div 
                key={group.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center gap-2">
                  <div className="flex-1 overflow-hidden">
                    {editingGroupId === group.id ? (
                      <input
                        autoFocus
                        className="w-full bg-white/20 text-white font-black px-2 py-0.5 rounded border border-white/30 outline-none focus:ring-1 focus:ring-white/50"
                        value={group.name}
                        onChange={(e) => updateGroupName(group.id, e.target.value)}
                        onBlur={() => setEditingGroupId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingGroupId(null);
                        }}
                      />
                    ) : (
                      <h3 
                        className="text-white font-black truncate cursor-pointer hover:bg-white/10 px-1 rounded transition-colors"
                        onDoubleClick={() => setEditingGroupId(group.id)}
                        title="雙擊修改組名"
                      >
                        {group.name}
                      </h3>
                    )}
                  </div>
                  <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap">
                    {group.members.length} 人
                  </span>
                </div>
                <div className="p-4 bg-slate-50">
                  <ul className="space-y-2">
                    {group.members.map((member, mIdx) => (
                      <li key={member.id} className="flex items-center text-slate-700 text-sm py-1 border-b border-slate-100 last:border-0">
                        <span className="w-6 text-indigo-300 font-mono text-xs">{mIdx + 1}</span>
                        <span className="font-medium">{member.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {groups.length === 0 && (
        <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <i className="fa-solid fa-object-group text-5xl mb-4 opacity-10"></i>
          <p>完成設定後點擊按鈕，視覺化分組結果將顯示於此</p>
        </div>
      )}
    </div>
  );
};

export default TeamSplitter;
