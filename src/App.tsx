/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { SearchBar } from './components/SearchBar';
import { Dashboard } from './components/Dashboard';
import { LineChart, Activity, Search } from 'lucide-react';

export default function App() {
  const [symbol, setSymbol] = useState<string>('AAPL');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Header */}
      <header className="bg-[#111] border-b border-zinc-800 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <LineChart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Finance<span className="text-indigo-500">Tracker</span>
            </span>
          </div>
          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <SearchBar onSelect={setSymbol} />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <Activity className="w-3 h-3" />
              Market Open
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search */}
      <div className="md:hidden p-4 bg-[#111] border-b border-zinc-800">
        <SearchBar onSelect={setSymbol} />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {symbol ? (
          <Dashboard symbol={symbol} />
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="bg-indigo-500/10 p-6 rounded-full mb-6 border border-indigo-500/20">
              <Search className="w-12 h-12 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Search for a stock</h2>
            <p className="text-zinc-500 max-w-md">
              Enter a stock symbol or company name above to view real-time quotes, historical charts, and key statistics.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
