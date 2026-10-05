import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Sliders,
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Download,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react';

export default function App() {
  // Input parameters state
  const [basePrice, setBasePrice] = useState(175);
  const [unitCost, setUnitCost] = useState(65);
  const [competitorPrice, setCompetitorPrice] = useState(195);
  const [marketingBudget, setMarketingBudget] = useState(500);
  const [dayType, setDayType] = useState('Weekday');

  // Client-side simulation logic
  const simulation = useMemo(() => {
    const dayMultipliers = {
      Weekday: 1.0,
      Weekend: 1.2,
      Holiday: 1.4,
    };

    const multiplier = dayMultipliers[dayType] || 1.0;
    const pricePoints = [];

    let maxRevenue = 0;
    let maxProfit = -Infinity;
    let optimalPrice = basePrice;
    let optimalProfit = 0;

    const startPrice = Math.max(10, Math.floor(basePrice * 0.4));
    const endPrice = Math.floor(basePrice * 1.8);
    const step = Math.max(1, Math.floor((endPrice - startPrice) / 25));

    for (let price = startPrice; price <= endPrice; price += step) {
      const priceRatio = price / Math.max(1, basePrice);
      const competitorRatio = competitorPrice / Math.max(1, price);
      const marketingLift = Math.log10(marketingBudget + 10) * 15;

      let demand = Math.round(
        (1000 / Math.pow(priceRatio, 1.4)) * competitorRatio * multiplier + marketingLift
      );
      demand = Math.max(0, demand);

      const revenue = Math.round(price * demand);
      const totalCost = Math.round(unitCost * demand + marketingBudget);
      const profit = Math.round(revenue - totalCost);

      if (profit > maxProfit) {
        maxProfit = profit;
        optimalPrice = price;
        optimalProfit = profit;
      }

      if (revenue > maxRevenue) {
        maxRevenue = revenue;
      }

      pricePoints.push({
        price,
        demand,
        revenue,
        profit,
      });
    }

    // Baseline calculation at user's set base price
    const basePriceRatio = basePrice / Math.max(1, basePrice);
    const baseCompetitorRatio = competitorPrice / Math.max(1, basePrice);
    const baseMarketingLift = Math.log10(marketingBudget + 10) * 15;
    let baseDemand = Math.round(
      (1000 / Math.pow(basePriceRatio, 1.4)) * baseCompetitorRatio * multiplier + baseMarketingLift
    );
    baseDemand = Math.max(0, baseDemand);
    const baseRevenue = Math.round(basePrice * baseDemand);
    const baseTotalCost = Math.round(unitCost * baseDemand + marketingBudget);
    const baseProfit = Math.round(baseRevenue - baseTotalCost);

    const profitGain = optimalProfit - baseProfit;
    const profitLift = baseProfit !== 0 ? ((profitGain / Math.abs(baseProfit)) * 100).toFixed(1) : '0.0';
    const profitMargin = maxRevenue > 0 ? ((optimalProfit / maxRevenue) * 100).toFixed(1) : '0.0';

    return {
      metrics: {
        optimal_price: optimalPrice,
        max_revenue: maxRevenue,
        optimal_profit: optimalProfit,
        profit_margin: profitMargin,
        base_profit: baseProfit,
        profit_gain: profitGain,
        profit_lift: profitLift,
      },
      curve_data: pricePoints,
    };
  }, [basePrice, unitCost, competitorPrice, marketingBudget, dayType]);

  const { metrics, curve_data } = simulation;

  // Export results as CSV
  const exportCSV = () => {
    const headers = ['Price ($)', 'Demand (Units)', 'Revenue ($)', 'Profit ($)'];
    const rows = curve_data.map((row) => [row.price, row.demand, row.revenue, row.profit]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `price_elasticity_simulation.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          Price Elasticity & Profitability Simulator
        </h1>
        <p className="text-slate-400 mt-2 text-sm md:text-base">
          Evaluate demand curves, maximum revenue, and optimal unit profit margins in real-time
        </p>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Sidebar */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-200">Parameter Controls</h2>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Base Price ($)</span>
                <span className="font-semibold text-indigo-400">${basePrice}</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Unit Cost ($)</span>
                <span className="font-semibold text-indigo-400">${unitCost}</span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Competitor Price ($)</span>
                <span className="font-semibold text-indigo-400">${competitorPrice}</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                value={competitorPrice}
                onChange={(e) => setCompetitorPrice(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Marketing Budget ($)</span>
                <span className="font-semibold text-indigo-400">${marketingBudget}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={marketingBudget}
                onChange={(e) => setMarketingBudget(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Day Type</label>
              <select
                value={dayType}
                onChange={(e) => setDayType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="Weekday">Weekday (1.0x Demand)</option>
                <option value="Weekend">Weekend (1.2x Demand)</option>
                <option value="Holiday">Holiday (1.4x Demand)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Dashboard Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                OPTIMAL PRICE
              </div>
              <p className="text-2xl font-bold text-emerald-400">${metrics.optimal_price}</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                MAX REVENUE
              </div>
              <p className="text-2xl font-bold text-cyan-400">
                ${metrics.max_revenue.toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                OPTIMAL PROFIT
              </div>
              <p className="text-2xl font-bold text-indigo-400">
                ${metrics.optimal_profit.toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <PieChart className="w-4 h-4 text-purple-400" />
                PROFIT MARGIN
              </div>
              <p className="text-2xl font-bold text-purple-400">{metrics.profit_margin}%</p>
            </div>
          </div>

          {/* Profitability Impact Analysis Banner */}
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400">
                {metrics.profit_gain >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-300">Profitability Impact Analysis</h4>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Unit Cost set at <span className="font-semibold text-amber-200">${unitCost}</span>. Moving from baseline price (<span className="font-semibold text-amber-200">${basePrice}</span>) to optimal (<span className="font-semibold text-amber-200">${metrics.optimal_price}</span>) increases total net profit.
                </p>
              </div>
            </div>
            <div className="flex gap-6 text-right shrink-0 ml-4">
              <div>
                <span className="block text-[10px] text-amber-400/80 font-medium">PROFIT GAIN</span>
                <span className="text-sm font-bold text-amber-300">
                  {metrics.profit_gain >= 0 ? '+' : ''}${metrics.profit_gain.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-amber-400/80 font-medium">PROFIT LIFT</span>
                <span className="text-sm font-bold text-amber-300">
                  {metrics.profit_lift >= 0 ? '+' : ''}{metrics.profit_lift}%
                </span>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-semibold text-slate-200">
                Simulated Revenue, Profit & Demand Curves
              </h3>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm px-4 py-2 rounded-lg border border-slate-700 transition"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={curve_data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="price" stroke="#94a3b8" unit="$" />
                  <YAxis yAxisId="left" stroke="#94a3b8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend />
                  <ReferenceLine
                    yAxisId="right"
                    x={metrics.optimal_price}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: `Optimal: $${metrics.optimal_price}`,
                      fill: '#10b981',
                      position: 'top',
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="demand"
                    stroke="#38bdf8"
                    name="Demand (Units)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#818cf8"
                    name="Revenue ($)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    name="Profit ($)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Financial Breakdown Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-x-auto">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">
              Financial Breakdown Across Scenarios
            </h3>
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="p-3">Price ($)</th>
                  <th className="p-3">Demand (Units)</th>
                  <th className="p-3">Revenue ($)</th>
                  <th className="p-3">Profit ($)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {curve_data.map((row) => (
                  <tr
                    key={row.price}
                    className={
                      row.price === metrics.optimal_price
                        ? 'bg-emerald-950/30 text-emerald-300 font-medium'
                        : 'hover:bg-slate-800/40'
                    }
                  >
                    <td className="p-3">${row.price}</td>
                    <td className="p-3">{row.demand.toLocaleString()}</td>
                    <td className="p-3">${row.revenue.toLocaleString()}</td>
                    <td className="p-3">${row.profit.toLocaleString()}</td>
                    <td className="p-3">
                      {row.price === metrics.optimal_price && (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Optimal Target
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}