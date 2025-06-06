import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface BotDetectionStatusProps {
  isBot: boolean;
  suspicionScore: number;
  flags: string[];
  showDetails?: boolean;
}

const BotDetectionStatus: React.FC<BotDetectionStatusProps> = ({
  isBot,
  suspicionScore,
  flags,
  showDetails = false
}) => {
  // Only show if there's significant suspicion
  if (suspicionScore < 30) {
    return null;
  }

  const getSeverityColor = (score: number) => {
    if (score >= 80) return 'destructive';
    if (score >= 50) return 'default';
    return 'default';
  };

  const getSeverityLabel = (score: number) => {
    if (score >= 80) return 'High Risk';
    if (score >= 50) return 'Suspicious';
    return 'Monitor';
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert variant={getSeverityColor(suspicionScore)} className="border-l-4">
        <div className="flex items-start space-x-2">
          {isBot ? (
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          ) : (
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <AlertDescription>
              <div className="font-medium text-sm">
                Security Monitor: {getSeverityLabel(suspicionScore)}
              </div>
              <div className="text-xs mt-1 text-muted-foreground">
                Activity Score: {suspicionScore}/100
              </div>
              {showDetails && flags.length > 0 && (
                <div className="mt-2 text-xs">
                  <details className="cursor-pointer">
                    <summary className="hover:text-foreground">
                      Detection Details ({flags.length})
                    </summary>
                    <ul className="mt-1 space-y-1 text-muted-foreground">
                      {flags.slice(0, 3).map((flag, index) => (
                        <li key={index} className="truncate">
                          • {flag}
                        </li>
                      ))}
                      {flags.length > 3 && (
                        <li className="text-xs">
                          ... and {flags.length - 3} more
                        </li>
                      )}
                    </ul>
                  </details>
                </div>
              )}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default BotDetectionStatus;
