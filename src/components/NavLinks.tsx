
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, BarChart2, Settings, AlertCircle } from 'lucide-react';

const NavLinks: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="flex flex-col space-y-1">
      <Link 
        to="/" 
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isActive('/') 
            ? "bg-primary text-primary-foreground" 
            : "hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Home size={16} />
        <span>Dashboard</span>
      </Link>
      
      <Link 
        to="/api-settings" 
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isActive('/api-settings') 
            ? "bg-primary text-primary-foreground" 
            : "hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Settings size={16} />
        <span>API Access</span>
      </Link>
      
      <div className="px-3 py-1">
        <div className="border-t border-border my-1"></div>
      </div>
      
      <a 
        href="https://github.com/yourusername/aqi-prediction-app/issues" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <AlertCircle size={16} />
        <span>Report Issue</span>
      </a>
    </div>
  );
};

export default NavLinks;
