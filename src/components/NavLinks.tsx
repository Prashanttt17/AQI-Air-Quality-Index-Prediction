
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, LayoutDashboard, Settings } from 'lucide-react';

const NavLinks: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link to="/" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
        </Link>
      </Button>
      
      <Button asChild variant="ghost" size="sm">
        <Link to="/backend-settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </Button>
    </div>
  );
};

export default NavLinks;
