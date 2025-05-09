
import React from 'react';
import { Link } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NavLinks: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link to="/" className="flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          Dashboard
        </Link>
      </Button>
    </div>
  );
};

export default NavLinks;
