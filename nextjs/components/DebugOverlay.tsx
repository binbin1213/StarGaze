'use client';

import { useState, useEffect, useRef } from 'react';
import { getWorkerUrl } from '@/lib/config';

// Global buffer for logs before component mounts
const logBuffer: { type: string; message: string; time: string }[] = [];
let isCapturing = false;

if (typeof window !== 'undefined' && !isCapturing) {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  const addLog = (type: string, args: any[]) => {
    const message = args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}\n${arg.stack}`;
      }
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return '[Circular or Unserializable Object]';
        }
      }
      return String(arg);
    }).join(' ');
    
    logBuffer.push({ 
      type, 
      message, 
      time: new Date().toLocaleTimeString() 
    });
    if (logBuffer.length > 100) logBuffer.shift();
  };

  console.log = (...args) => {
    originalLog(...args);
    addLog('log', args);
  };
  console.error = (...args) => {
    originalError(...args);
    addLog('error', args);
  };
  console.warn = (...args) => {
    originalWarn(...args);
    addLog('warn', args);
  };
  isCapturing = true;
  logBuffer.push({ 
    type: 'log', 
    message: 'DebugOverlay Capture Initialized', 
    time: new Date().toLocaleTimeString() 
  });
}

export default function DebugOverlay() {
  const [logs, setLogs] = useState<{ type: string; message: string; time: string }[]>(logBuffer);
  const [isVisible, setIsVisible] = useState(false);
  const [envInfo, setEnvInfo] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs([...logBuffer]);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEnvInfo(`URL: ${window.location.href}\nWorker: ${getWorkerUrl()}`);
    }
  }, []);

  useEffect(() => {
    // 只有在开发模式或手动开启时生效
    if (process.env.NODE_ENV !== 'development' && !window.location.search.includes('debug=true')) {
      return;
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isVisible && (typeof window !== 'undefined' && window.location.search.includes('debug=true'))) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-black/80 text-white p-2 rounded-full text-xs border border-white/20"
      >
        DEBUG
      </button>
    );
  }

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col font-mono text-[10px]">
      <div className="flex items-center justify-between p-2 border-b border-white/10 bg-gray-900">
        <span className="text-blue-400 font-bold">MOBILE DEBUG LOGS</span>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              logBuffer.length = 0;
              setLogs([]);
            }}
            className="px-2 py-1 bg-gray-800 rounded"
          >
            CLEAR
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="px-2 py-1 bg-red-900 rounded"
          >
            CLOSE
          </button>
        </div>
      </div>
      <div className="p-2 bg-gray-800 text-gray-300 border-b border-white/5 whitespace-pre-wrap break-all">
        {envInfo}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1">
        {logs.length === 0 && <p className="text-gray-500 italic">No logs yet...</p>}
        {logs.map((log, i) => (
          <div key={i} className={`border-l-2 pl-2 ${
            log.type === 'error' ? 'border-red-500 text-red-400' : 
            log.type === 'warn' ? 'border-yellow-500 text-yellow-400' : 
            'border-blue-500 text-blue-300'
          }`}>
            <span className="text-gray-500 mr-2">[{log.time}]</span>
            <span className="whitespace-pre-wrap break-all">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
