
import React, { useState, useRef, useMemo } from 'react';
import { Participant } from '../types';

interface Props {
  participants: Participant[];
  onUpdate: (newList: Participant[]) => void;
}

const ParticipantManager: React.FC<Props> = ({ participants, onUpdate }) => {
  const [inputText, setInputText] = useState(participants.map(p => p.name).join('\n'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Identify duplicate names
  const duplicateNames = useMemo(() => {
    const counts: Record<string, number> = {};
    participants.forEach(p => {
      const name = p.name.trim();
      counts[name] = (counts[name] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter(name => counts[name] > 1));
  }, [participants]);

  const processNames = (text: string) => {
    const names = text
      .split(/[\n,]+/)
      .map(name => name.trim())
      .filter(name => name !== '');
    
    const newList = names.map((name, index) => ({
      id: `${Date.now()}-${index}`,
      name
    }));
    
    onUpdate(newList);
    setInputText(names.join('\n'));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processNames(content);
    };
    reader.readAsText(file);
  };

  const removeDuplicates = () => {
    const seen = new Set<string>();
    const newList: Participant[] = [];
    
    participants.forEach(p => {
      const name = p.name.trim();
      if (!seen.has(name)) {
        seen.add(name);
        newList.push(p);
      }
    });
    
    onUpdate(newList);
    setInputText(newList.map(p => p.name).join('\n'));
  };

  const clearAll = () => {
    if (confirm('確定要清空所有名單嗎？')) {
      onUpdate([]);
      setInputText('');
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <i className="fa-solid fa-user-plus text-indigo-500 mr-2"></i> 匯入參與者
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">貼上姓名 (每行一個或逗號隔開)</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="王小明&#10;李小華&#10;張三..."
                className="w-full h-64 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none font-mono text-sm text-white"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => processNames(inputText)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95"
              >
                儲存名單
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95"
              >
                <i className="fa-solid fa-file-csv mr-2"></i> 匯入 CSV
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".csv,.txt"
              />
            </div>
            
            <button
              onClick={clearAll}
              className="w-full text-slate-400 hover:text-red-500 text-sm font-medium transition-colors"
            >
              清空名單
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <i className="fa-solid fa-users text-indigo-500 mr-2"></i> 當前名單 ({participants.length})
            </h2>
            {duplicateNames.size > 0 && (
              <button
                onClick={removeDuplicates}
                className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-bold hover:bg-amber-200 transition-colors flex items-center gap-1 animate-pulse"
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i> 移除重複姓名
              </button>
            )}
          </div>
          
          {participants.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
              <i className="fa-solid fa-user-slash text-4xl mb-4 opacity-20"></i>
              <p>尚無參與者，請從左側匯入</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[500px] border border-slate-100 rounded-xl bg-slate-50 p-4">
              <ul className="divide-y divide-slate-100">
                {participants.map((p, idx) => {
                  const isDuplicate = duplicateNames.has(p.name.trim());
                  return (
                    <li key={p.id} className={`py-2 flex justify-between items-center group ${isDuplicate ? 'bg-amber-50/50 -mx-4 px-4' : ''}`}>
                      <span className={`font-medium flex items-center ${isDuplicate ? 'text-amber-700' : 'text-slate-700'}`}>
                        <span className="text-slate-300 mr-2 tabular-nums w-6">{idx + 1}.</span>
                        {p.name}
                        {isDuplicate && (
                          <span className="ml-2 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">重複</span>
                        )}
                      </span>
                      <button 
                        onClick={() => onUpdate(participants.filter(item => item.id !== p.id))}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantManager;
