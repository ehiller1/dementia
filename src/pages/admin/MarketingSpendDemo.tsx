/**
 * Marketing Spend Optimization Demo
 * Placeholder page for marketing spend optimization demo
 */

export default function MarketingSpendDemo() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-white mb-2">Marketing Spend Optimization</h1>
        <p className="text-gray-400">Demo page for marketing spend optimization scenarios</p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Coming Soon</h2>
          <p className="text-gray-400">Marketing spend optimization demo will be available here</p>
        </div>
      </div>
    </div>
  );
}

