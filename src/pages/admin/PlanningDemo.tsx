/**
 * Planning Demo
 * Placeholder page for planning demo
 */

export default function PlanningDemo() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-white mb-2">Planning</h1>
        <p className="text-gray-400">Demo page for planning scenarios</p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Coming Soon</h2>
          <p className="text-gray-400">Planning demo will be available here</p>
        </div>
      </div>
    </div>
  );
}

