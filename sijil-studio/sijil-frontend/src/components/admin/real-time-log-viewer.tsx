'use client';

import * as React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info,
  Terminal
} from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: any;
}

interface RealTimeLogViewerProps {
  logs: LogEntry[];
}

const getLevelConfig = (level: string) => {
  switch (level) {
    case 'success':
      return {
        icon: CheckCircle,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-600 dark:text-green-400',
        borderColor: 'border-green-500/20',
        badgeColor: 'bg-green-500 text-white'
      };
    case 'error':
      return {
        icon: XCircle,
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-600 dark:text-red-400',
        borderColor: 'border-red-500/20',
        badgeColor: 'bg-red-500 text-white'
      };
    case 'warn':
      return {
        icon: AlertCircle,
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-600 dark:text-yellow-400',
        borderColor: 'border-yellow-500/20',
        badgeColor: 'bg-yellow-500 text-white'
      };
    default:
      return {
        icon: Info,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-600 dark:text-blue-400',
        borderColor: 'border-blue-500/20',
        badgeColor: 'bg-blue-500 text-white'
      };
  }
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

export const RealTimeLogViewer: React.FC<RealTimeLogViewerProps> = ({ logs }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = React.useState(true);

  // Auto-scroll to bottom when new logs arrive
  React.useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Waiting for operations...</p>
          <p className="text-xs mt-1">Logs will appear here in real-time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Auto-scroll toggle */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            autoScroll
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          {autoScroll ? '⏸ Pause' : '▶ Auto-scroll'}
        </button>
      </div>

      <ScrollArea 
        ref={scrollRef}
        className="h-[300px] w-full bg-slate-950 dark:bg-black/95"
        onScroll={handleScroll}
      >
        <div className="p-4 space-y-2 font-mono text-sm">
          {logs.map((log, index) => {
            const config = getLevelConfig(log.level);
            const Icon = config.icon;

            return (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor} transition-all hover:bg-opacity-20`}
              >
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.textColor}`} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`${config.badgeColor} text-[10px] px-1.5 py-0 h-4`}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  
                  <p className={`${config.textColor} break-words`}>
                    {log.message}
                  </p>
                  
                  {log.details && (
                    <pre className="mt-2 p-2 bg-black/30 rounded text-xs text-gray-300 dark:text-gray-400 overflow-x-auto">
                      {typeof log.details === 'object' 
                        ? JSON.stringify(log.details, null, 2)
                        : String(log.details)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
