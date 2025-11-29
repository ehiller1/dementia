import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Settings, 
  Users, 
  Database, 
  Activity, 
  GitBranch, 
  Zap,
  Layers,
  ArrowLeft,
  Network,
  Package,
  Phone,
  TrendingUp,
  Calendar,
  Building
} from 'lucide-react';

const adminPages = [
  { path: '/admin/system-config', name: 'System Configuration', icon: Settings, color: 'blue' },
  { path: '/admin/agent-marketplace', name: 'Agent Marketplace', icon: Users, color: 'purple' },
  { path: '/admin/agent-registry', name: 'Agent Registry', icon: Database, color: 'indigo' },
  { path: '/admin/agent-flow', name: 'Agent Flow Visualization', icon: Network, color: 'violet' },
  { path: '/admin/memory-inspector', name: 'Memory Inspector', icon: Database, color: 'green' },
  { path: '/admin/event-monitor', name: 'Event Bus Monitor', icon: Activity, color: 'orange' },
  { path: '/admin/orchestration-state', name: 'Orchestration State', icon: GitBranch, color: 'cyan' },
  { path: '/admin/intelligence-metrics', name: 'Intelligence Metrics', icon: Zap, color: 'yellow' },
  { path: '/admin/stack-builder', name: 'Template Stack Builder', icon: Layers, color: 'pink' },
  { path: '/admin/decision-stacks', name: 'Decision Stack Manager', icon: Package, color: 'emerald' },
];

const demoPages = [
  { path: '/admin/demo/call-center', name: 'Call Center', icon: Phone, color: 'blue' },
  { path: '/admin/demo/marketing-spend', name: 'Marketing Spend Optimization', icon: TrendingUp, color: 'green' },
  { path: '/admin/demo/planning', name: 'Planning', icon: Calendar, color: 'purple' },
  { path: '/admin/demo/facilities', name: 'Facilities Management', icon: Building, color: 'orange' },
];

export default function AdminLayout() {
  const location = useLocation();
  
  // Check if current route is a demo page that needs full-screen rendering
  const isDemoPage = location.pathname.startsWith('/admin/demo/');
  const isCallCenterDemo = location.pathname === '/admin/demo/call-center';

  // For full-screen demos (like call center), render without sidebar
  if (isCallCenterDemo) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        {/* Minimal header for navigation */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <Link 
                to="/admin" 
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm">Back to Admin</span>
              </Link>
              <div className="text-sm text-gray-400">
                Call Center Coaching Demo
              </div>
            </div>
          </div>
        </div>
        <div className="h-full w-full" style={{ paddingTop: '60px' }}>
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/" 
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm">Back to App</span>
              </Link>
              <div className="h-6 w-px bg-slate-700" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Admin Console
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs font-medium">
                System Online
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="col-span-3">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-4 sticky top-24">
              {/* Demo Section - Moved to Top */}
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Demo
              </h2>
              <nav className="space-y-1">
                {demoPages.map((page) => {
                  const Icon = page.icon;
                  const isActive = location.pathname === page.path;
                  
                  return (
                    <Link
                      key={page.path}
                      to={page.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? `bg-${page.color}-500/20 border border-${page.color}-500/30 text-${page.color}-400`
                          : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{page.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Admin Tools Section */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Admin Tools
                </h2>
                <nav className="space-y-1">
                  {adminPages.map((page) => {
                    const Icon = page.icon;
                    const isActive = location.pathname === page.path;
                    
                    return (
                      <Link
                        key={page.path}
                        to={page.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive
                            ? `bg-${page.color}-500/20 border border-${page.color}-500/30 text-${page.color}-400`
                            : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{page.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Quick Stats
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Agents</span>
                    <span className="text-white font-semibold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Events/min</span>
                    <span className="text-white font-semibold">4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory Usage</span>
                    <span className="text-white font-semibold">2.4 GB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
