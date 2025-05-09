
import React from 'react';
import { Link } from 'react-router-dom';
import { Gauge, Settings, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBackendSettings } from '@/utils/backend-integration';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const NavLinks: React.FC = () => {
  const { enabled: backendEnabled } = getBackendSettings();

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link to="/" className="flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          Dashboard
        </Link>
      </Button>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="sm">
              <Link to="/backend-settings" className="flex items-center gap-2">
                <Server className={`h-4 w-4 ${backendEnabled ? 'text-green-500' : ''}`} />
                ML Backend
                {backendEnabled && (
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                )}
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {backendEnabled 
              ? 'Backend integration active' 
              : 'Configure backend integration'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default NavLinks;
