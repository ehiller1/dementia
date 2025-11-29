/**
 * App Header Component
 * Persistent navigation header shown across all pages after login
 */

import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brain, Home as HomeIcon, ShoppingCart, Activity, Layers, Zap, Settings, Plus, Upload, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useSupabaseAuth();
  const [selectedModel, setSelectedModel] = useState("Marketing");
  const [signingOut, setSigningOut] = useState(false);
  
  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleExcelUpload = () => {
    // Trigger file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('Excel file selected:', file.name);
        // TODO: Handle file upload
      }
    };
    input.click();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Branding */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AMIGO
              </h1>
            </div>
          </Link>

          {/* Center: Navigation Menu */}
          <nav className="flex items-center gap-2">
            <Link 
              to="/" 
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                isActive("/") && location.pathname === "/"
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <HomeIcon className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link 
              to="/signals" 
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                isActive("/signals")
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Activity className="h-4 w-4" />
              <span>Mesh Configuration</span>
            </Link>
            <Link 
              to="/decision-stack" 
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                isActive("/decision-stack")
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Layers className="h-4 w-4" />
              <span>Functional Points of View</span>
            </Link>
            <Link 
              to="/simulation-sources" 
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                isActive("/simulation-sources")
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Zap className="h-4 w-4" />
              <span>Mesh Signals</span>
            </Link>
            <Link 
              to="/admin/system-config" 
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                isActive("/admin")
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Settings className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          </nav>


            {/* Auth Controls */}
            {user && (
              <Button 
                variant="ghost" 
                size="sm"
                className="text-sm text-gray-700 hover:text-gray-900"
                disabled={signingOut}
                onClick={async () => {
                  if (signingOut) return;
                  setSigningOut(true);
                  try {
                    await signOut();
                  } catch (e) {
                    // ignore
                  } finally {
                    setSigningOut(false);
                    navigate('/', { replace: true });
                  }
                }}
              >
                {signingOut ? 'Signing out…' : 'Sign Out'}
              </Button>
            )}
          </div>
      </div>
    </div>
  );
}
