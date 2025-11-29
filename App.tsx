import React, { useState, useEffect } from 'react';
import { Calculator, RefreshCw, DollarSign, TrendingDown, Calendar, Info } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { calculateContract, formatMoney, formatMillions, ContractData, CalculationResult } from './utils/calculations';
import { InfoTooltip } from './components/InfoTooltip';

const App: React.FC = () => {
  // Default to a "Shohei Ohtani" style structure for initial state
  const [formData, setFormData] = useState<ContractData>({
    totalValue: 700000000,
    years: 10,
    deferralAmount: 680000000,
    deferralStartYear: 1, // Starts 1 year after contract ends
    payoutDuration: 10,
    interestRate: 4.43 // Approximate Federal Mid-Term Rate at time of Ohtani deal
  });

  const [results, setResults] = useState<CalculationResult | null>(null);

  useEffect(() => {
    const res = calculateContract(formData);
    setResults(res);
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'totalValue' || name === 'deferralAmount') {
      // Remove commas to parse the number
      const rawValue = value.replace(/,/g, '');
      
      // Allow empty input to act as 0
      if (rawValue === '') {
        setFormData(prev => ({ ...prev, [name]: 0 }));
        return;
      }

      // Only update if it's a valid number
      if (!isNaN(Number(rawValue))) {
        setFormData(prev => ({
          ...prev,
          [name]: parseFloat(rawValue)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    }
  };

  const loadScenario = (scenario: 'ohtani' | 'scherzer' | 'standard') => {
    if (scenario === 'ohtani') {
      setFormData({
        totalValue: 700_000_000,
        years: 10,
        deferralAmount: 680_000_000,
        deferralStartYear: 1,
        payoutDuration: 10,
        interestRate: 4.43
      });
    } else if (scenario === 'scherzer') {
      // Modeled roughly after Scherzer's Nats deal: $210M, 7 years, $105M deferred
      setFormData({
        totalValue: 210_000_000,
        years: 7,
        deferralAmount: 105_000_000,
        deferralStartYear: 1,
        payoutDuration: 7,
        interestRate: 2.5 // Historic rate approx
      });
    } else {
      setFormData({
        totalValue: 100_000_000,
        years: 5,
        deferralAmount: 0,
        deferralStartYear: 1,
        payoutDuration: 5,
        interestRate: 4.5
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-slate-900 text-white pt-8 pb-12 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">MLB Deferred Contract Calculator</h1>
          </div>
          <p className="text-slate-400 max-w-2xl">
            Calculate the Competitive Balance Tax (Luxury Tax) implications of deferred money in MLB contracts 
            based on Article XXIII of the Collective Bargaining Agreement.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Contract Terms</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => loadScenario('standard')}
                    className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => loadScenario('ohtani')}
                    className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded transition-colors border border-blue-200"
                  >
                    Load "The Ohtani"
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Total Contract Value ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-semibold text-lg">$</span>
                    <input 
                      type="text" 
                      name="totalValue"
                      value={formData.totalValue.toLocaleString()}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-lg font-medium bg-slate-700 text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      Length (Years)
                    </label>
                    <input 
                      type="number" 
                      name="years"
                      value={formData.years}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-medium bg-slate-700 text-white placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center">
                      Interest Rate (%)
                      <InfoTooltip text="The Federal Mid-Term Rate (Imputed Loan Interest Rate) as defined in Article XXIII. Used to discount future payments." />
                    </label>
                    <input 
                      type="number" 
                      name="interestRate"
                      step="0.01"
                      value={formData.interestRate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-medium bg-slate-700 text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Deferrals</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      Total Amount Deferred ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-semibold text-lg">$</span>
                      <input 
                        type="text" 
                        name="deferralAmount"
                        value={formData.deferralAmount.toLocaleString()}
                        onChange={handleInputChange}
                        className="w-full pl-8 pr-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-lg font-medium bg-slate-700 text-white placeholder-slate-400"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {((formData.deferralAmount / formData.totalValue) * 100).toFixed(1)}% of total contract
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center">
                        Delay (Years)
                        <InfoTooltip text="Years after the contract expires before deferred payments begin." />
                      </label>
                      <input 
                        type="number" 
                        name="deferralStartYear"
                        value={formData.deferralStartYear}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-medium bg-slate-700 text-white placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        Payout Period
                      </label>
                      <input 
                        type="number" 
                        name="payoutDuration"
                        value={formData.payoutDuration}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-medium bg-slate-700 text-white placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Methodology Card */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 text-sm text-blue-900">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Info size={16} /> Calculation Methodology
              </h3>
              <p className="mb-2">
                The <strong>Competitive Balance Tax (CBT)</strong> hit is calculated by determining the Present Value (PV) of the deferred salary using the Federal Mid-Term Rate.
              </p>
              <p>
                According to the 2022-2026 Basic Agreement, deferred compensation is included in the Player's Salary in the year earned at its discounted present value.
              </p>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top Level Stats */}
            {results && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-500">Nominal AAV</h3>
                    <DollarSign className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{formatMillions(results.nominalAAV)}</p>
                  <p className="text-xs text-slate-500 mt-1">Actual dollars / years</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 ring-4 ring-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-blue-700">CBT AAV (Tax Hit)</h3>
                    <RefreshCw className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{formatMillions(results.cbtAAV)}</p>
                  <p className="text-xs text-blue-400 mt-1">Discounted present value / years</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-500">Total Present Value</h3>
                    <TrendingDown className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{formatMillions(results.totalPresentValue)}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {results.effectiveDiscount.toFixed(1)}% discount on total value
                  </p>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Financial Timeline</h3>
              <div className="h-80 w-full">
                {results && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={results.yearlyBreakdown}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" hide={results.yearlyBreakdown.length > 15} />
                      <YAxis 
                        tickFormatter={(value) => `$${value / 1000000}M`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatMoney(value)}
                        labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                      />
                      <Legend />
                      <ReferenceLine x={`Year ${formData.years}`} stroke="red" strokeDasharray="3 3" label="Contract Ends" />
                      <Bar dataKey="payoutReceived" name="Cash Received" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cbtValue" name="CBT Hit (Tax)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Year-by-Year Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">Year</th>
                      <th className="px-6 py-3 text-right">Cash Salary</th>
                      <th className="px-6 py-3 text-right bg-blue-50/50 text-blue-800">CBT Hit</th>
                      <th className="px-6 py-3 text-right">Deferred Payout</th>
                      <th className="px-6 py-3 text-right font-bold">Total Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results?.yearlyBreakdown.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50">
                        <td className="px-6 py-3 font-medium text-slate-700">{row.label}</td>
                        <td className="px-6 py-3 text-right text-slate-500">
                          {row.year <= formData.years ? formatMillions(row.cashPay) : '-'}
                        </td>
                        <td className="px-6 py-3 text-right font-medium bg-blue-50/30 text-blue-600">
                          {row.year <= formData.years ? formatMoney(row.cbtValue) : '-'}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-500">
                          {row.year > formData.years && row.payoutReceived > 0 ? formatMillions(row.payoutReceived) : '-'}
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-slate-800">
                          {formatMoney(row.payoutReceived)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;