import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sliders, DollarSign, TrendingUp, HelpCircle, Download, RefreshCw, ArrowUpRight, PieChart, Wallet } from 'lucide-react';
import PriceChart from './PriceChart';

export default function PriceSimulator() {
  // Parameter States
  const [basePrice, setBasePrice] = useState(175);
  const [unitCost, setUnitCost] = useState(65);
  const [competitorPrice, setCompetitorPrice] = useState(195);
  const [marketingBudget, setMarketingBudget] = useState(500);
  const [dayType, setDayType] = useState('Weekend');

  // Response States
  const [simulationData, setSimulationData] = useState([]);
  const [optimalPrice, setOptimalPrice] = useState(0);
  const [maxRevenue, setMaxRevenue] = useState(0);
  const [classification, setClassification] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch simulation data from backend
  const fetchSimulation = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/simulate', {
        base_price: parseFloat(basePrice) || 0,
        competitor_price: parseFloat(competitorPrice) || 0,
        marketing_budget: parseFloat(marketingBudget) || 0,
        day_type: dayType,
      });

      const { optimal_price, max_revenue, classification, simulation_curve } = response.data;
      
      // Enrich backend curve with cost & profit metrics
      const cost = parseFloat(unitCost) || 0;
      const enrichedCurve = (simulation_curve || []).map((item) => {
        const totalCost = item.demand * cost;
        const profit = item.revenue - totalCost;
        const margin = item.revenue > 0 ? ((profit / item.revenue) * 100).toFixed(1) : 0;

        return {
          ...item,
          unitCost: cost,
          totalCost,
          profit,
          margin: parseFloat(margin),
        };
      });

      setOptimalPrice(optimal_price);
      setMaxRevenue(max_revenue);
      setClassification(classification);
      setSimulationData(enrichedCurve);
    } catch (error) {
      console.error('Error fetching simulation data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced API call on parameter change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSimulation();
    }, 200);

    return () => clearTimeout(timer);
  }, [basePrice, unitCost, competitorPrice, marketingBudget, dayType]);

  // Derived Metrics for Baseline & Optimal Points
  const optimalStep = simulationData.find((item) => item.price === optimalPrice) || { profit: 0, margin: 0, demand: 0, revenue: 0 };
  const baselineStep = simulationData.find((item) => Math.abs(item.price - parseFloat(basePrice)) < 15) || simulationData[0] || { profit: 0, margin: 0, revenue: 0 };

  const profitDelta = optimalStep.profit - baselineStep.profit;
  const percentageProfitLift = baselineStep.profit > 0 ? ((profitDelta / baselineStep.profit) * 100).toFixed(1) : 0;

  // CSV Export Handler
  const exportToCSV = () => {
    if (!simulationData || simulationData.length === 0) return;

    const headers = ['Price ($)', 'Demand (Units)', 'Revenue ($)', 'Unit Cost ($)', 'Total Cost ($)', 'Profit ($)', 'Margin (%)'];
    const rows = simulationData.map((item) => [
      item.price,
      item.demand,
      item.revenue,
      item.unitCost,
      item.totalCost,
      item.profit,
      item.margin,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', `price_profit_simulation_${basePrice}_USD.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header */}
      <header className="mb-8 text-center max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
          Price Elasticity & Profitability Simulator
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          Evaluate demand curves, maximum revenue, and optimal unit profit margins in real-time
        </p>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
        
        {/* Left Control Panel */}
        <div className="lg:col-span-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-700">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-100">Parameter Controls</h2>
          </div>

          {/* Base Price Slider & Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <label className="text-slate-300 font-medium">Base Price ($):</label>
              <input
                type="number"
                min="10"
                max="500"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-right text-blue-400 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="5"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Unit Cost Slider & Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <label className="text-slate-300 font-medium">Unit Cost ($):</label>
              <input
                type="number"
                min="0"
                max="300"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-right text-amber-400 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <input
              type="range"
              min="0"
              max="300"
              step="5"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Competitor Price Slider & Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <label className="text-slate-300 font-medium">Competitor Price ($):</label>
              <input
                type="number"
                min="10"
                max="500"
                value={competitorPrice}
                onChange={(e) => setCompetitorPrice(e.target.value)}
                className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-right text-blue-400 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="5"
              value={competitorPrice}
              onChange={(e) => setCompetitorPrice(e.target.value)}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Marketing Budget Slider & Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <label className="text-slate-300 font-medium">Marketing Budget ($):</label>
              <input
                type="number"
                min="0"
                max="2000"
                value={marketingBudget}
                onChange={(e) => setMarketingBudget(e.target.value)}
                className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-right text-blue-400 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={marketingBudget}
              onChange={(e) => setMarketingBudget(e.target.value)}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Day Type Selector */}
          <div className="space-y-2 pt-2">
            <label className="block text-sm font-medium text-slate-300">Day Type:</label>
            <select
              value={dayType}
              onChange={(e) => setDayType(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Weekday">Weekday</option>
              <option value="Weekend">Weekend</option>
              <option value="Holiday">Holiday</option>
            </select>
          </div>
        </div>

        {/* Right Dashboard Area */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top Key Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Optimal Price Card */}
            <div className="bg-slate-800/90 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 shadow-md">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Optimal Price
                </span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">${Number(optimalPrice).toFixed(2)}</p>
            </div>

            {/* Max Revenue Card */}
            <div className="bg-slate-800/90 p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 shadow-md">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Max Revenue
                </span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-cyan-400">
                ${Number(maxRevenue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>

            {/* Total Profit Card */}
            <div className="bg-slate-800/90 p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 shadow-md">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Optimal Profit
                </span>
                <Wallet className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-400">
                ${Number(optimalStep.profit).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>

            {/* Profit Margin Card */}
            <div className="bg-slate-800/90 p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 shadow-md">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Profit Margin
                </span>
                <PieChart className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-400">
                {optimalStep.margin}%
              </p>
            </div>

          </div>

          {/* Profit Gain Summary Banner */}
          <div className="bg-amber-950/30 border border-amber-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-300">Profitability Impact Analysis</h4>
                <p className="text-xs text-slate-300">
                  Unit Cost set at <span className="font-semibold text-amber-400">${unitCost}</span>. Moving from baseline price (${basePrice}) to optimal (${optimalPrice}) increases total net profit.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-amber-500/20 pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto justify-between sm:justify-end">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Profit Gain</span>
                <span className="text-lg font-extrabold text-amber-400">+${profitDelta.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Profit Lift</span>
                <span className="text-lg font-extrabold text-emerald-400">+{percentageProfitLift}%</span>
              </div>
            </div>
          </div>

          {/* Chart Card */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                Simulated Revenue, Profit & Demand Curves
                {loading && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
              </h3>

              {/* CSV Export Button */}
              <button
                onClick={exportToCSV}
                disabled={loading || simulationData.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 border border-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                Export CSV
              </button>
            </div>

            <PriceChart data={simulationData} optimalPrice={optimalPrice} />
          </div>

          {/* Comprehensive Financial Table */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h3 className="text-md font-semibold text-slate-100 mb-4">Scenario Financial Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-700/50 rounded-lg">
                  <tr>
                    <th className="px-3 py-3 rounded-l-lg">Price</th>
                    <th className="px-3 py-3">Demand</th>
                    <th className="px-3 py-3">Revenue</th>
                    <th className="px-3 py-3">Total Cost</th>
                    <th className="px-3 py-3">Profit</th>
                    <th className="px-3 py-3">Margin</th>
                    <th className="px-3 py-3 rounded-r-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {simulationData.map((row, idx) => {
                    const isOptimal = row.price === optimalPrice;
                    const isBase = Math.abs(row.price - basePrice) < 5;

                    return (
                      <tr key={idx} className={isOptimal ? 'bg-emerald-950/30' : isBase ? 'bg-blue-950/20' : ''}>
                        <td className="px-3 py-2.5 font-bold text-slate-200">${row.price.toFixed(2)}</td>
                        <td className="px-3 py-2.5">{row.demand.toLocaleString()}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-100">${row.revenue.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-slate-400">${row.totalCost.toLocaleString()}</td>
                        <td className={`px-3 py-2.5 font-bold ${row.profit >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                          ${row.profit.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-purple-300">{row.margin}%</td>
                        <td className="px-3 py-2.5">
                          {isOptimal && (
                            <span className="px-2 py-0.5 text-xs font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                              Optimal
                            </span>
                          )}
                          {isBase && !isOptimal && (
                            <span className="px-2 py-0.5 text-xs font-bold text-blue-400 bg-blue-500/20 border border-blue-500/30 rounded-full">
                              Baseline
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}