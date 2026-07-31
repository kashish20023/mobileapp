'use client';

import React, { useEffect, useState } from 'react';
import { api, ApiCallLog } from '../lib/api';
import { 
  Terminal, 
  Trash2, 
  Layers, 
  Settings, 
  Check, 
  Copy, 
  Globe, 
  HelpCircle, 
  Wifi, 
  WifiOff, 
  Database,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

export default function ApiConsole() {
  const [logs, setLogs] = useState<ApiCallLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ApiCallLog | null>(null);
  const [baseUrl, setBaseUrl] = useState('http://localhost:3001');
  const [useMock, setUseMock] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  useEffect(() => {
    // Initial sync
    setBaseUrl(api.getBaseUrl());
    setUseMock(api.getMockFallback());
    setToken(api.getToken());

    // Listen to log changes
    const unsubLogs = api.onLogsChange((newLogs) => {
      setLogs(newLogs);
      // Automatically select the newest log if none selected or if a new one arrives
      if (newLogs.length > 0 && (!selectedLog || !newLogs.find(l => l.id === selectedLog.id))) {
        setSelectedLog(newLogs[0]);
      }
    });

    // Monitor token changes by polling occasionally or setting up an interval
    const interval = setInterval(() => {
      const currentToken = api.getToken();
      if (currentToken !== token) {
        setToken(currentToken);
      }
    }, 1000);

    return () => {
      unsubLogs();
      clearInterval(interval);
    };
  }, [selectedLog, token]);

  const handleBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBaseUrl(val);
    api.setBaseUrl(val);
  };

  const handleMockToggle = () => {
    const val = !useMock;
    setUseMock(val);
    api.setMockFallback(val);
  };

  const handleManualTokenChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.trim() || null;
    setToken(val);
    api.setToken(val);
  };

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleClearLogs = () => {
    api.clearLogs();
    setSelectedLog(null);
  };

  const syntaxHighlight = (jsonObj: any): string => {
    if (jsonObj === undefined || jsonObj === null) return '';
    try {
      let json = JSON.stringify(jsonObj, null, 2);
      json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      });
    } catch {
      return String(jsonObj);
    }
  };

  const copyToClipboard = (text: any, id: string) => {
    const str = typeof text === 'object' ? JSON.stringify(text, null, 2) : text;
    navigator.clipboard.writeText(str);
    setCopiedLogId(id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden shadow-2xl border-slate-800">
      {/* Console Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400">
            <Terminal size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 flex items-center gap-2">
              API Debugger Console
            </h2>
            <p className="text-xs text-slate-400">Inspect backend network interactions in real-time</p>
          </div>
        </div>

        {/* Global Settings Trigger/Status */}
        <div className="flex items-center gap-3">
          {logs.length > 0 && (
            <button 
              onClick={handleClearLogs}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition px-2 py-1.5 rounded bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent"
              title="Clear Logs"
            >
              <Trash2 size={13} />
              <span>Clear Logs</span>
            </button>
          )}
          
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <Database size={12} className="text-emerald-400" />
            <span className="text-slate-300 font-medium">Logs: {logs.length}</span>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="p-4 bg-slate-900/40 border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Endpoint Overrider */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Globe size={13} className="text-indigo-400" />
            Backend Base URL
          </label>
          <div className="relative">
            <input 
              type="text" 
              value={baseUrl}
              onChange={handleBaseUrlChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 pl-8 transition duration-200"
              placeholder="e.g. http://localhost:3001"
            />
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
              <Wifi size={14} className="text-indigo-400/70" />
            </div>
          </div>
        </div>

        {/* Toggle Mode */}
        <div className="flex flex-col justify-end gap-1.5">
          <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 h-[38px] hover:border-slate-700 transition">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              {useMock ? <WifiOff size={13} className="text-amber-400" /> : <Wifi size={13} className="text-emerald-400" />}
              Mock Data Mode
            </span>
            <button 
              onClick={handleMockToggle}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${useMock ? 'bg-amber-500' : 'bg-slate-700'}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useMock ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Token Vault */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5 border-t border-slate-800/60 pt-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <KeyRound size={13} className="text-indigo-400" />
              Authorization Token Vault (Bearer)
            </label>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowToken(!showToken)}
                className="text-slate-400 hover:text-slate-200 transition"
                title={showToken ? "Hide Token" : "Show Token"}
              >
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              {token && (
                <button
                  onClick={handleCopyToken}
                  className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition"
                >
                  {copiedToken ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copiedToken ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>
          </div>
          <textarea
            value={token || ''}
            onChange={handleManualTokenChange}
            rows={1}
            className={`w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 transition font-mono ${!showToken && token ? 'filter blur-[3px] select-none hover:blur-0' : ''}`}
            placeholder="No token active. Perform phone + OTP verification to retrieve token or paste one manually."
          />
        </div>
      </div>

      {/* Main Console Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-slate-950/60">
        
        {/* Logs List Pane (Left half of Console) */}
        <div className="w-full lg:w-5/12 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col min-h-[200px] lg:min-h-0">
          <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Request History
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-900/60">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Terminal size={24} className="text-slate-600 mb-2 animate-pulse" />
                <p className="text-xs text-slate-500">No API calls detected yet.</p>
                <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">Interact with the phone simulator on the left to trigger endpoints.</p>
              </div>
            ) : (
              logs.map((log, idx) => {
                const isSuccess = log.responseStatus && log.responseStatus >= 200 && log.responseStatus < 300;
                const isError = log.error || (log.responseStatus && log.responseStatus >= 400);
                
                return (
                  <div
                    key={`${log.id}-${idx}`}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3 text-xs cursor-pointer transition flex items-start justify-between gap-3 ${selectedLog?.id === log.id ? 'bg-slate-900/80 border-l-2 border-indigo-500' : 'hover:bg-slate-900/40'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold px-1.5 py-0.5 rounded-[4px] text-[10px] ${
                          log.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          log.method === 'GET' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                          log.method === 'PATCH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {log.method}
                        </span>
                        
                        <span className={`text-[10px] font-semibold px-1 py-0.5 rounded-[4px] ${
                          log.isMocked ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          isSuccess ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          isError ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {log.responseStatus || (log.error ? 'ERR' : 'PENDING')}
                        </span>
                        
                        {log.isMocked && (
                          <span className="bg-slate-800 text-slate-400 text-[9px] px-1 rounded uppercase font-semibold">
                            Mock
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-1 text-slate-300 font-mono text-[11px] truncate" title={log.url}>
                        {log.url.replace(baseUrl, '')}
                      </div>

                      <div className="mt-1 text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono flex flex-col items-end shrink-0 gap-1">
                      {log.durationMs !== undefined && <span>{log.durationMs}ms</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Log Inspector (Right half of Console) */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedLog ? (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Log URL banner */}
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-slate-400 text-[10px] font-semibold font-mono">
                    {selectedLog.method} - {selectedLog.url}
                  </div>
                  {selectedLog.error && (
                    <div className="text-rose-400 text-[10px] mt-1 font-semibold">
                      Network Error: {selectedLog.error}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(selectedLog, selectedLog.id)}
                    className="flex items-center gap-1 text-[10px] bg-slate-950 border border-slate-800 hover:border-indigo-500/30 hover:text-indigo-400 text-slate-400 px-2 py-1 rounded transition shrink-0"
                  >
                    {copiedLogId === selectedLog.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span>{copiedLogId === selectedLog.id ? 'Copied' : 'Copy All'}</span>
                  </button>
                </div>
              </div>

              {/* JSON Sub-inspector panels */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Headers */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Request Headers</h4>
                  <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-300 border border-slate-800/60 overflow-x-auto">
                    {JSON.stringify(selectedLog.headers, null, 2)}
                  </pre>
                </div>

                {/* Request Payload */}
                {selectedLog.requestBody && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Request Payload</h4>
                      <button
                        onClick={() => copyToClipboard(selectedLog.requestBody, selectedLog.id + '-req')}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition"
                      >
                        {copiedLogId === selectedLog.id + '-req' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre 
                      className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono border border-slate-800/60 overflow-x-auto whitespace-pre"
                      dangerouslySetInnerHTML={{ __html: syntaxHighlight(selectedLog.requestBody) }}
                    />
                  </div>
                )}

                {/* Response Payload */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Response Payload</h4>
                    {selectedLog.responseBody && (
                      <button
                        onClick={() => copyToClipboard(selectedLog.responseBody, selectedLog.id + '-res')}
                        className="text-[10px] text-slate-500 hover:text-indigo-400 transition"
                      >
                        {copiedLogId === selectedLog.id + '-res' ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  {selectedLog.responseBody ? (
                    <pre 
                      className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono border border-slate-800/60 overflow-x-auto whitespace-pre"
                      dangerouslySetInnerHTML={{ __html: syntaxHighlight(selectedLog.responseBody) }}
                    />
                  ) : (
                    <div className="p-3 bg-slate-950/60 rounded-lg text-[11px] font-mono text-slate-500 italic border border-slate-800/60">
                      No response body returned.
                    </div>
                  )}
                </div>

                {/* CORS & Server unreachable Help Alert */}
                {selectedLog.error && !selectedLog.isMocked && (
                  <div className="bg-rose-500/5 border border-rose-500/20 p-3.5 rounded-lg text-xs">
                    <h5 className="font-semibold text-rose-400 mb-1 flex items-center gap-1">
                      <HelpCircle size={14} />
                      Connection Troubleshooting Guide
                    </h5>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      The browser blocked or could not reach your backend server at <code className="text-rose-300 font-mono">{baseUrl}</code>. Please confirm:
                    </p>
                    <ul className="list-disc pl-4 text-slate-400 mt-1.5 space-y-1 text-[11px]">
                      <li>Your NestJS backend is actively running on port 3001.</li>
                      <li>
                        CORS is enabled in NestJS: Ensure you call <code className="text-slate-300 font-mono">app.enableCors()</code> in your <code className="text-slate-300 font-mono">main.ts</code> backend entry point.
                      </li>
                      <li>Alternatively, you can toggle the <strong>Mock Data Mode</strong> at the top of the console to simulate offline responses and test UI designs.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Layers size={32} className="text-slate-600 mb-2 animate-pulse" />
              <p className="text-xs">Select a request from history to inspect headers and JSON bodies.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
