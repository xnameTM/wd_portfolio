"use client";

import { useEffect, useState } from "react";

type LoadingOverlayProps = {
  durationMs?: number;
  onFinish?: () => void;
};

const TERMINAL_LINES = [
  "> INITIALIZING SECURE BOOT...",
  "> LOADING ENCRYPTED PROTOCOLS...",
  "> BYPASSING FIREWALL_V3...",
  "> ACCESSING RESTRICTED FILES...",
  "> DECRYPTING PERSONAL DATABASE...",
  "> SYSTEM READY FOR ENTRY",
];

// Variable delays for non-linear display (in ms)
const LINE_DELAYS = [0, 500, 850, 1300, 1950, 2950];

export default function LoadingOverlay({
  durationMs = 5000,
  onFinish,
}: LoadingOverlayProps) {
  const [isActive, setIsActive] = useState(true);
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsActive(false);
      onFinish?.();
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [durationMs, onFinish]);

  useEffect(() => {
    document.body.style.overflow = isActive ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isActive]);

  // Animate lines with non-linear timing
  useEffect(() => {
    if (!isActive) return;
    
    // Show terminal after 100ms
    const terminalTimer = setTimeout(() => setShowTerminal(true), 100);
    
    let currentLine = 0;
    const startTime = Date.now();
    
    const animationLoop = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      while (currentLine < TERMINAL_LINES.length && elapsed >= LINE_DELAYS[currentLine]) {
        setVisibleLines(currentLine + 1);
        currentLine += 1;
      }
      
      if (currentLine >= TERMINAL_LINES.length) {
        clearInterval(animationLoop);
        // Show progress bar after last line appears
        setShowProgressBar(true);
      }
    }, 30);

    return () => {
      clearTimeout(terminalTimer);
      clearInterval(animationLoop);
    };
  }, [isActive]);

  // Animate progress bar from 0-100% over the duration
  useEffect(() => {
    if (!isActive) return;
    
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(Math.round(newProgress));
      
      if (newProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 30);

    return () => clearInterval(progressInterval);
  }, [isActive, durationMs]);

  // Generate animated progress bar
  const getProgressBar = () => {
    const filled = Math.floor((progress / 100) * 10);
    const empty = 10 - filled;
    const bar = "█".repeat(filled) + "░".repeat(empty);
    return `> [${bar}] ${progress}%`;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/98 text-white transition-opacity duration-700 ${
        isActive ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6">
        <div className={`h-[240px] space-y-2 overflow-hidden rounded-lg border border-slate-700/60 bg-black/60 p-4 font-mono transition-all duration-500 ${
          showTerminal ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <div className="space-y-1">
            {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
              <div key={i} className="text-[0.75rem] leading-relaxed text-slate-400 flex-shrink-0">
                <span>{line}</span>
              </div>
            ))}
            {visibleLines > 0 && (
              <div className="text-[0.75rem] leading-relaxed text-slate-400 flex-shrink-0">
                <span>{getProgressBar()}</span>
                {progress < 100 && (
                  <span className="ml-1 inline-block animate-pulse">▌</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="scanlines pointer-events-none absolute inset-0" />
    </div>
  );
}
