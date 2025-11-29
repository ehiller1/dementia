/**
 * Facilities Management Demo
 * Placeholder page for facilities management demo
 */

export default function FacilitiesDemo() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-white mb-2">Facilities Management</h1>
        <p className="text-gray-400">Demo page for facilities management scenarios</p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Coming Soon</h2>
          <p className="text-gray-400">Facilities management demo will be available here</p>
        </div>
      </div>
    </div>
  );
}

