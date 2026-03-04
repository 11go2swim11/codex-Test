import { useState, useEffect, ReactNode } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Clock, Download } from 'lucide-react';
import { StockChart } from './StockChart';

interface DashboardProps {
  symbol: string;
}

export function Dashboard({ symbol }: DashboardProps) {
  const [quote, setQuote] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState('1y');

  const downloadCSV = () => {
    if (!history || history.length === 0) return;
    const fmt = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : '');

    const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume'];
    const rows = history.map(d => [
      new Date(d.date).toLocaleDateString(),
      fmt(d.open),
      fmt(d.high),
      fmt(d.low),
      fmt(d.close),
      fmt(d.adjClose),
      typeof d.volume === 'number' && Number.isFinite(d.volume) ? d.volume : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${symbol}_${range}_history.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const period1Date = new Date();
        switch (range) {
          case '1m': period1Date.setMonth(period1Date.getMonth() - 1); break;
          case '3m': period1Date.setMonth(period1Date.getMonth() - 3); break;
          case '6m': period1Date.setMonth(period1Date.getMonth() - 6); break;
          case '1y': period1Date.setFullYear(period1Date.getFullYear() - 1); break;
          case '5y': period1Date.setFullYear(period1Date.getFullYear() - 5); break;
          default: period1Date.setFullYear(period1Date.getFullYear() - 1);
        }

        const [quoteRes, historyRes] = await Promise.all([
          fetch(`/api/quote/${encodeURIComponent(symbol)}`),
          fetch(`/api/history/${encodeURIComponent(symbol)}?period1=${period1Date.toISOString()}`)
        ]);

        if (!quoteRes.ok || !historyRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const quoteData = await quoteRes.json();
        const historyData = await historyRes.json();

        if (quoteData.error || historyData.error) {
          throw new Error(quoteData.details || historyData.details || quoteData.error || historyData.error || 'Failed to fetch data');
        }

        setQuote(quoteData);
        setHistory(historyData);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Could not load data for this symbol.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, range]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-medium animate-pulse">Loading {symbol} data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center">
        <p className="font-medium">{error}</p>
        <p className="text-sm mt-2 opacity-80">Please try another symbol.</p>
      </div>
    );
  }

  if (!quote) return null;

  const isPositive = quote.regularMarketChange >= 0;
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-[#111] p-6 rounded-2xl shadow-xl border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">{quote.symbol}</h1>
            <span className="px-2.5 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-md tracking-wider uppercase border border-zinc-700">
              {quote.exchange}
            </span>
          </div>
          <h2 className="text-sm text-zinc-500 mt-1 font-medium">{quote.shortName || quote.longName}</h2>
        </div>
        
        <div className="text-left md:text-right flex flex-col items-end gap-3">
          <div className="text-4xl font-light text-white tracking-tight">
            ${quote.regularMarketPrice?.toFixed(2)}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={downloadCSV}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded-lg border border-zinc-700 transition-all uppercase tracking-wider"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border ${isPositive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
              <ChangeIcon className="w-4 h-4" />
              <span className="font-bold text-xs">
                {isPositive ? '+' : ''}{quote.regularMarketChange?.toFixed(2)} ({isPositive ? '+' : ''}{quote.regularMarketChangePercent?.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <StockChart 
        data={history} 
        symbol={symbol} 
        range={range} 
        onRangeChange={setRange} 
      />

      {/* Bottom Grid: Order Book & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Book (Simulated) */}
        <div className="lg:col-span-1 bg-[#111] p-5 rounded-2xl border border-zinc-800 shadow-xl">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-3 h-3 text-indigo-500" />
            Order Book
          </h3>
          <div className="space-y-4">
            {/* Sell Orders */}
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => {
                const price = quote.regularMarketPrice + (5 - i) * 0.05;
                const size = Math.floor(Math.random() * 100) + 10;
                const width = (size / 110) * 100;
                return (
                  <div key={`sell-${i}`} className="relative h-6 flex items-center justify-between px-2 text-[11px] font-mono">
                    <div className="absolute inset-0 bg-rose-500/5 right-0" style={{ width: `${width}%`, left: 'auto' }} />
                    <span className="text-rose-400 z-10">{price.toFixed(2)}</span>
                    <span className="text-zinc-500 z-10">{size}</span>
                  </div>
                );
              })}
            </div>
            {/* Spread */}
            <div className="py-2 border-y border-zinc-800 flex justify-between items-center px-2">
              <span className="text-lg font-bold text-white font-mono">${quote.regularMarketPrice?.toFixed(2)}</span>
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Spread 0.01</span>
            </div>
            {/* Buy Orders */}
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => {
                const price = quote.regularMarketPrice - (i + 1) * 0.05;
                const size = Math.floor(Math.random() * 100) + 10;
                const width = (size / 110) * 100;
                return (
                  <div key={`buy-${i}`} className="relative h-6 flex items-center justify-between px-2 text-[11px] font-mono">
                    <div className="absolute inset-0 bg-emerald-500/5 left-0" style={{ width: `${width}%` }} />
                    <span className="text-emerald-400 z-10">{price.toFixed(2)}</span>
                    <span className="text-zinc-500 z-10">{size}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard 
            icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
            label="Market Cap" 
            value={formatNumber(quote.marketCap)} 
          />
          <StatCard 
            icon={<BarChart3 className="w-4 h-4 text-blue-500" />}
            label="Volume" 
            value={formatNumber(quote.regularMarketVolume)} 
          />
          <StatCard 
            icon={<TrendingUp className="w-4 h-4 text-amber-500" />}
            label="52W High" 
            value={`$${quote.fiftyTwoWeekHigh?.toFixed(2)}`} 
          />
          <StatCard 
            icon={<TrendingDown className="w-4 h-4 text-rose-500" />}
            label="52W Low" 
            value={`$${quote.fiftyTwoWeekLow?.toFixed(2)}`} 
          />
          <StatCard 
            icon={<Clock className="w-4 h-4 text-purple-500" />}
            label="Prev Close" 
            value={`$${quote.regularMarketPreviousClose?.toFixed(2)}`} 
          />
          <StatCard 
            icon={<Activity className="w-4 h-4 text-cyan-500" />}
            label="Open" 
            value={`$${quote.regularMarketOpen?.toFixed(2)}`} 
          />
          <StatCard 
            icon={<BarChart3 className="w-4 h-4 text-indigo-500" />}
            label="PE Ratio" 
            value={quote.trailingPE?.toFixed(2) || 'N/A'} 
          />
          <StatCard 
            icon={<DollarSign className="w-4 h-4 text-teal-500" />}
            label="EPS" 
            value={`$${quote.epsTrailingTwelveMonths?.toFixed(2) || 'N/A'}`} 
          />
          <StatCard 
            icon={<Activity className="w-4 h-4 text-orange-500" />}
            label="Beta" 
            value={quote.beta?.toFixed(2) || 'N/A'} 
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <div className="bg-[#111] p-4 rounded-2xl border border-zinc-800 flex flex-col gap-3 hover:border-zinc-700 transition-all shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
        <div className="p-1.5 bg-zinc-900 rounded-lg border border-zinc-800">
          {icon}
        </div>
      </div>
      <p className="text-lg font-bold text-white font-mono">{value}</p>
    </div>
  );
}

function formatNumber(num: number) {
  if (!num) return 'N/A';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toString();
}
