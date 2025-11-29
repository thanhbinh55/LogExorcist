"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { Bug, Zap, Terminal, AlertTriangle, History, X, Scissors } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import CodeSurgeryView from "@/components/CodeSurgeryView";

interface AnalysisHistory {
  id: string;
  timestamp: number;
  logPreview: string;
  logFull: string;
  analysis: string;
}

interface CodeSurgeryData {
  diagnosis: string;
  root_cause: string;
  evidence: string;
  original_code_snippet: string;
  fixed_code_snippet: string;
  mermaid_diagram: string;
  severity: "High" | "Medium" | "Low";
  quick_fix: string;
  proper_fix: string;
  prevention: string;
}

export default function Home() {
  const [logInput, setLogInput] = useState("");
  const [codeInput, setCodeInput] = useState(""); // Separate input for code
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [codeSurgeryMode, setCodeSurgeryMode] = useState(true); // Default to Code Surgery mode
  const [codeSurgeryData, setCodeSurgeryData] = useState<CodeSurgeryData | null>(null);
  const [isLoadingSurgery, setIsLoadingSurgery] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, append, isLoading, setMessages } = useChat({
    api: "/api/chat",
    id: undefined, // Mỗi lần submit sẽ tạo conversation mới
    onFinish: (message) => {
      // Save to history when analysis completes
      if (logInput.trim()) {
        const newHistoryItem: AnalysisHistory = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          logPreview: logInput.substring(0, 100) + (logInput.length > 100 ? "..." : ""),
          logFull: logInput,
          analysis: message.content,
        };
        const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
        setHistory(updatedHistory);
        localStorage.setItem("logExorcistHistory", JSON.stringify(updatedHistory));
      }
    },
  });

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("logExorcistHistory");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }
  }, []);

  // Auto-scroll output to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textareas
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [logInput]);

  useEffect(() => {
    if (codeTextareaRef.current) {
      codeTextareaRef.current.style.height = "auto";
      codeTextareaRef.current.style.height = `${codeTextareaRef.current.scrollHeight}px`;
    }
  }, [codeInput]);

  const handleExorcise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logInput.trim() || isLoading || isLoadingSurgery) return;

    if (codeSurgeryMode) {
      // Code Surgery Mode - Call new API
      setIsLoadingSurgery(true);
      setCodeSurgeryData(null);
      setMessages([]);

      // Combine log and code inputs
      let combinedInput = logInput;
      if (codeInput.trim()) {
        combinedInput = `=== ERROR LOG ===\n${logInput}\n\n=== CODE SNIPPET (Suspected Issue) ===\n${codeInput}`;
      }

      try {
        const response = await fetch("/api/code-surgery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: combinedInput }],
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to analyze");
        }

        const data = await response.json();
        setCodeSurgeryData(data);

        // Save to history
        const newHistoryItem: AnalysisHistory = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          logPreview: logInput.substring(0, 100) + (logInput.length > 100 ? "..." : ""),
          logFull: logInput,
          analysis: JSON.stringify(data),
        };
        const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
        setHistory(updatedHistory);
        localStorage.setItem("logExorcistHistory", JSON.stringify(updatedHistory));
      } catch (error) {
        console.error("Code Surgery error:", error);
        alert("Failed to analyze. Please try again.");
      } finally {
        setIsLoadingSurgery(false);
      }
    } else {
      // Normal Mode - Use existing chat
      setMessages([]);
      setCodeSurgeryData(null);
      await append({
        role: "user",
        content: logInput,
      });
    }
  };

  const loadHistoryItem = (item: AnalysisHistory) => {
    setLogInput(item.logFull || item.logPreview.replace("...", ""));
    setShowHistory(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("logExorcistHistory");
  };

  const currentAnalysis = messages
    .filter((m) => m.role === "assistant")
    .map((m) => m.content)
    .join("");

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-dark-border bg-dark-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-8 h-8 text-neon-purple glow-purple" />
            <div>
              <h1 className="text-2xl font-bold text-neon-purple">
                The Log Exorcist
              </h1>
              <p className="text-xs text-gray-400">
                AI-Powered Log Analysis & Debugging
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border rounded-lg hover:bg-dark-border transition-colors"
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* History Sidebar */}
        {showHistory && (
          <div className="w-80 border-r border-dark-border bg-dark-surface/80 backdrop-blur-sm flex flex-col">
            <div className="p-4 border-b border-dark-border flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-neon-purple" />
                Recent Analyses
              </h2>
              <div className="flex gap-2">
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs text-gray-400 hover:text-red-400"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {history.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No analysis history yet
                </div>
              ) : (
                <div className="p-2">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      className="w-full text-left p-3 mb-2 bg-dark-bg border border-dark-border rounded-lg hover:border-neon-purple/50 transition-colors"
                    >
                      <div className="text-xs text-gray-400 mb-1">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-300 truncate">
                        {item.logPreview}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Split Screen Layout */}
        <div className="flex-1 flex">
          {/* Left Side - Input */}
          <div className="flex-1 flex flex-col border-r border-dark-border">
            <div className="p-4 border-b border-dark-border bg-dark-surface/30">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Bug className="w-5 h-5 text-neon-purple" />
                    Paste Your Logs
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Drop in any error log, stack trace, or debug output
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Mode:</span>
                  <button
                    onClick={() => setCodeSurgeryMode(!codeSurgeryMode)}
                    className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${
                      codeSurgeryMode
                        ? "bg-neon-purple text-white"
                        : "bg-dark-bg border border-dark-border text-gray-300 hover:border-neon-purple"
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    {codeSurgeryMode ? "Code Surgery" : "Normal"}
                  </button>
                </div>
              </div>
            </div>
            <form onSubmit={handleExorcise} className="flex-1 flex flex-col" id="log-form">
              <div className="p-4 border-b border-dark-border">
                <button
                  type="submit"
                  disabled={!logInput.trim() || isLoading || isLoadingSurgery}
                  className="w-full py-3 px-6 bg-gradient-to-r from-neon-purple to-purple-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-neon-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-purple"
                >
                  {(isLoading || isLoadingSurgery) ? (
                    <>
                      <Zap className="w-5 h-5 animate-pulse" />
                      <span>{codeSurgeryMode ? "Performing Surgery..." : "Exorcising..."}</span>
                    </>
                  ) : (
                    <>
                      {codeSurgeryMode ? <Scissors className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                      <span>{codeSurgeryMode ? "Code Surgery" : "Exorcise Log"}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex-1 p-4">
                <textarea
                  ref={textareaRef}
                  value={logInput}
                  onChange={(e) => setLogInput(e.target.value)}
                  placeholder="Paste your logs here...&#10;&#10;Example:&#10;[ERROR] Connection timeout at 127.0.0.1:8080&#10;Traceback (most recent call last):&#10;  File &quot;app.py&quot;, line 42, in main&#10;    result = api_call()&#10;ConnectionError: Failed to connect"
                  className="w-full h-full bg-dark-bg border border-dark-border rounded-lg p-4 text-sm font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:border-neon-purple focus:glow-purple resize-none scrollbar-hide"
                  style={{ minHeight: "400px" }}
                />
              </div>
            </form>
          </div>

          {/* Right Side - Output */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-dark-border bg-dark-surface/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-neon-green" />
                Analysis Results
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Real-time AI-powered diagnosis
              </p>
            </div>
            <div
              ref={outputRef}
              className="flex-1 p-6 overflow-y-auto scrollbar-hide"
            >
              {codeSurgeryData ? (
                <CodeSurgeryView data={codeSurgeryData} />
              ) : currentAnalysis ? (
                <div className="prose prose-invert prose-headings:text-neon-purple prose-strong:text-neon-green prose-code:text-neon-purple max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg my-4"
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code
                            className="bg-dark-surface px-1.5 py-0.5 rounded text-neon-purple"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {currentAnalysis}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Terminal className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <p className="text-lg mb-2">Ready to Exorcise</p>
                    <p className="text-sm">
                      Paste your logs on the left and click "{codeSurgeryMode ? "Code Surgery" : "Exorcise Log"}"
                    </p>
                    {codeSurgeryMode && (
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Code Surgery mode shows visual diff view with code fixes
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

