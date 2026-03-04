import { format } from 'date-fns';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ComposedChart,
  Line,
  Cell,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { useMemo } from 'react';
import { calculateMA, calculateMACD, calculateRSI, HistoryData } from '../utils/indicators';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900/95 p-3 rounded-lg shadow-2xl border border-zinc-800 text-[11px] backdrop-blur-sm">
        <p className="font-bold text-zinc-400 mb-2 border-b border-zinc-800 pb-1">{label}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-zinc-500">O:</span>
          <span className="text-right font-mono text-zinc-300">${data.open?.toFixed(2)}</span>
          <span className="text-zinc-500">H:</span>
          <span className="text-right font-mono text-emerald-400">${data.high?.toFixed(2)}</span>
          <span className="text-zinc-500">L:</span>
          <span className="text-right font-mono text-rose-400">${data.low?.toFixed(2)}</span>
          <span className="text-zinc-500">C:</span>
          <span className="text-right font-mono font-bold text-zinc-100">${data.close?.toFixed(2)}</span>
          <span className="text-zinc-500">V:</span>
          <span className="text-right font-mono text-zinc-400">{(data.volume / 1000000).toFixed(2)}M</span>
        </div>
      </div>
    );
  }
  return null;
};

export function StockChart({ 
  data, 
  symbol, 
  range, 
  onRangeChange 
}: { 
  data: HistoryData[]; 
  symbol: string;
  range: string;
  onRangeChange: (range: string) => void;
}) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const ma5 = calculateMA(data, 5);
    const ma10 = calculateMA(data, 10);
    const ma20 = calculateMA(data, 20);
    const rsi = calculateRSI(data, 14);
    const { macdLine, signalLine, histogram } = calculateMACD(data);

    return data.map((d, i) => ({
      ...d,
      formattedDate: format(new Date(d.date), 'MM/dd'),
      ma5: ma5[i],
      ma10: ma10[i],
      ma20: ma20[i],
      rsi: rsi[i],
      macd: macdLine[i],
      signal: signalLine[i],
      hist: histogram[i],
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500 bg-zinc-950 rounded-xl border border-zinc-800">
        No historical data available for {symbol}
      </div>
    );
  }

  const minClose = Math.min(...chartData.map((d) => d.low));
  const maxClose = Math.max(...chartData.map((d) => d.high));

  const ranges = [
    { label: '1M', value: '1m' },
    { label: '3M', value: '3m' },
    { label: '6M', value: '6m' },
    { label: '1Y', value: '1y' },
    { label: '5Y', value: '5y' },
  ];

  return (
    <div className="w-full bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => onRangeChange(r.value)}
              className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                range === r.value 
                  ? 'bg-zinc-800 text-indigo-400 shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-4 text-[10px] font-mono">
          <span className="text-amber-400">MA5: {chartData[chartData.length-1]?.ma5?.toFixed(2)}</span>
          <span className="text-blue-400">MA10: {chartData[chartData.length-1]?.ma10?.toFixed(2)}</span>
          <span className="text-purple-400">MA20: {chartData[chartData.length-1]?.ma20?.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {/* Main Price Chart */}
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
              <XAxis
                dataKey="formattedDate"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#52525b', fontSize: 10 }}
                minTickGap={40}
              />
              <YAxis
                domain={[minClose * 0.99, maxClose * 1.01]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#52525b', fontSize: 10 }}
                tickFormatter={(val) => val.toFixed(1)}
                orientation="right"
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Close price */}
              <Area
                type="monotone"
                dataKey="close"
                stroke="#a5b4fc"
                fill="#6366f1"
                fillOpacity={0.08}
                strokeWidth={1.5}
                isAnimationActive={false}
              />

              {/* MAs */}
              <Line type="monotone" dataKey="ma5" stroke="#fbbf24" strokeWidth={1} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="ma10" stroke="#60a5fa" strokeWidth={1} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="ma20" stroke="#a78bfa" strokeWidth={1} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* MACD Chart */}
        <div className="h-[120px] w-full border-t border-zinc-900 pt-2">
          <div className="text-[9px] text-zinc-500 mb-1 font-mono px-2">MACD(12,26,9)</div>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
              <XAxis dataKey="formattedDate" hide />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 9 }} orientation="right" />
              <Bar dataKey="hist">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.hist >= 0 ? '#10b981' : '#ef4444'} opacity={0.6} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="macd" stroke="#60a5fa" strokeWidth={1} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="signal" stroke="#fbbf24" strokeWidth={1} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* RSI Chart */}
        <div className="h-[100px] w-full border-t border-zinc-900 pt-2">
          <div className="text-[9px] text-zinc-500 mb-1 font-mono px-2">RSI(14)</div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
              <XAxis dataKey="formattedDate" hide />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 9 }} orientation="right" ticks={[30, 70]} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={0.5} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" strokeWidth={0.5} />
              <Area type="monotone" dataKey="rsi" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.1} strokeWidth={1} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
