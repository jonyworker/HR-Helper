
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Participant, DrawHistory } from '../types';

interface Props {
  participants: Participant[];
  history: DrawHistory[];
  excludedIds: Set<string>;
  onDraw: (winner: Participant, prize: string, allowDuplicates: boolean) => void;
  onResetPool: () => void;
}

const LuckyDraw: React.FC<Props> = ({ participants, history, excludedIds, onDraw, onResetPool }) => {
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [displayWinner, setDisplayWinner] = useState<string | null>(null);
  const [rollingName, setRollingName] = useState<string>('');
  const [prizeName, setPrizeName] = useState('');
  
  const timerRef = useRef<number | null>(null);

  // The drawing pool is calculated from master list minus people who already won (if duplicates not allowed)
  const drawPool = useMemo(() => {
    return participants.filter(p => !excludedIds.has(p.id));
  }, [participants, excludedIds]);

  const startDraw = () => {
    if (drawPool.length === 0) {
      alert('抽籤池為空，請重置抽籤池或檢查名單！');
      return;
    }
    
    setIsDrawing(true);
    setDisplayWinner(null);
    
    let iterations = 0;
    const maxIterations = 30;
    const interval = 80;

    const roll = () => {
      // During animation, we can show names from the full list for excitement
      const randomIndex = Math.floor(Math.random() * participants.length);
      setRollingName(participants[randomIndex].name);
      
      iterations++;
      if (iterations < maxIterations) {
        timerRef.current = window.setTimeout(roll, interval);
      } else {
        finishDraw();
      }
    };

    roll();
  };

  const finishDraw = () => {
    // Selection is strictly from the drawPool
    const winnerIndex = Math.floor(Math.random() * drawPool.length);
    const winner = drawPool[winnerIndex];
    
    setDisplayWinner(winner.name);
    setIsDrawing(false);
    
    onDraw(winner, prizeName, allowDuplicates);
  };

  const downloadHistoryCSV = () => {
    if (history.length === 0) return;

    let csvContent = "抽籤時間,獎項,得獎者姓名\n";
    history.forEach(item => {
      csvContent += `"${item.timestamp.toLocaleString()}","${item.prize || '未設定'}","${item.winner}"\n`;
    });

    // Use BOM for Excel compatibility with Chinese characters
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `中獎紀錄_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-indigo-100 text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5">
           <i className="fa-solid fa-star absolute top-10 left-10 text-4xl rotate-12"></i>
           <i className="fa-solid fa-gift absolute bottom-10 right-20 text-5xl -rotate-12"></i>
           <i className="fa-solid fa-heart absolute top-20 right-10 text-3xl rotate-45"></i>
        </div>

        <div className="flex justify-between items-start mb-4">
           <div className="text-left bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">抽籤池狀態</p>
              <p className="text-sm font-black text-indigo-600">
                {drawPool.length} / {participants.length} 人
              </p>
           </div>
           {history.length > 0 && (
             <button 
                onClick={() => { if(confirm('確定要清空抽籤紀錄與重置抽籤池嗎？')) onResetPool(); }}
                className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors"
             >
                <i className="fa-solid fa-rotate-left mr-1"></i> 重置抽籤池
             </button>
           )}
        </div>

        <h2 className="text-3xl font-black text-slate-800 mb-8 tracking-wide">
          <i className="fa-solid fa-crown text-amber-400 mr-2"></i> 幸運大抽籤
        </h2>

        <div className="flex flex-col md:flex-row gap-6 mb-8 justify-center items-center">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-bold text-slate-500 mb-1">獎品名稱 (可選)</label>
            <input
              type="text"
              value={prizeName}
              onChange={(e) => setPrizeName(e.target.value)}
              placeholder="例如：頭獎 iPhone 15"
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-center text-white"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <span className="text-sm font-bold text-slate-600">重複抽取：</span>
            <button 
              onClick={() => setAllowDuplicates(!allowDuplicates)}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${allowDuplicates ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${allowDuplicates ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className="text-xs text-slate-400 ml-1">{allowDuplicates ? 'ON' : 'OFF'}</span>
          </div>
        </div>

        <div className="relative h-48 flex items-center justify-center bg-indigo-50 rounded-2xl mb-8 border-2 border-dashed border-indigo-200">
          {isDrawing ? (
            <div className="text-5xl font-black text-indigo-600 animate-pulse transition-all">
              {rollingName}
            </div>
          ) : displayWinner ? (
            <div className="animate-bounce scale-110">
              <p className="text-indigo-400 font-bold mb-1 uppercase tracking-widest text-xs">Congratulations!</p>
              <div className="text-6xl font-black text-indigo-700 drop-shadow-lg">
                {displayWinner}
              </div>
            </div>
          ) : (
            <div className="text-slate-300 font-medium italic">
              {drawPool.length === 0 ? '抽籤池已空，請點擊右上角重置' : '準備好後，點擊下方按鈕開始'}
            </div>
          )}
        </div>

        <button
          onClick={startDraw}
          disabled={isDrawing || drawPool.length === 0}
          className={`w-full md:w-64 px-8 py-4 rounded-full font-black text-xl shadow-2xl transition-all active:scale-95 ${
            isDrawing || drawPool.length === 0
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:from-indigo-700 hover:to-blue-600 hover:shadow-indigo-200'
          }`}
        >
          {isDrawing ? (
            <span>
              <i className="fa-solid fa-spinner fa-spin mr-2"></i> 抽取中...
            </span>
          ) : (
            <span>
              <i className="fa-solid fa-play mr-2"></i> 開始抽籤
            </span>
          )}
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-700 flex items-center">
            <i className="fa-solid fa-clock-rotate-left mr-2 text-indigo-400"></i> 中獎紀錄 ({history.length})
          </h3>
          {history.length > 0 && (
            <button
              onClick={downloadHistoryCSV}
              className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-200 transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-download"></i> 匯出 CSV 紀錄
            </button>
          )}
        </div>
        
        {history.length === 0 ? (
          <p className="text-center py-8 text-slate-400 italic">尚未有抽獎紀錄</p>
        ) : (
          <div className="max-h-64 overflow-y-auto pr-2">
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-slate-500 bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2">時間</th>
                  <th className="px-4 py-2">獎項</th>
                  <th className="px-4 py-2">得獎者</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-indigo-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400">{item.timestamp.toLocaleTimeString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-600">{item.prize}</td>
                    <td className="px-4 py-3 text-sm font-bold text-indigo-600">{item.winner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LuckyDraw;
