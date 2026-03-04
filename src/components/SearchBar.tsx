import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchResult {
  symbol: string;
  shortname: string;
  longname: string;
  exchange: string;
  typeDisp: string;
}

export function SearchBar({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const search = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search/${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.quotes) {
          // Filter for stocks and ETFs, and ensure they have a symbol
          setResults(data.quotes.filter((q: any) => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.typeDisp)));
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-zinc-500" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-2.5 border border-zinc-800 rounded-xl leading-5 bg-zinc-900/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-lg backdrop-blur-sm"
          placeholder="Search symbol or company (e.g. AAPL, NVDA)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Loader2 className="h-4 w-4 text-zinc-500 animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-[100] mt-2 w-full bg-[#111] border border-zinc-800 shadow-2xl max-h-80 rounded-xl py-2 text-base overflow-auto focus:outline-none sm:text-sm backdrop-blur-xl">
          {results.map((result, idx) => (
            <div
              key={`${result.symbol}-${idx}`}
              className="cursor-pointer select-none relative py-3 px-4 hover:bg-zinc-800 transition-colors border-b border-zinc-900 last:border-0"
              onClick={() => {
                onSelect(result.symbol);
                setQuery('');
                setShowDropdown(false);
              }}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white font-mono">{result.symbol}</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{result.exchange}</span>
              </div>
              <div className="text-zinc-400 text-xs truncate font-medium">{result.shortname || result.longname}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
