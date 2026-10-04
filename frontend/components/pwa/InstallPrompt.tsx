"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running in standalone PWA mode
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    if (isRunningStandalone) {
      return;
    }

    // Check if dismissed previously
    const dismissed = localStorage.getItem("vanvas_install_dismissed") === "true";
    setIsDismissed(dismissed);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        console.log("[VANVAS PWA] User accepted installation prompt");
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosPrompt(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowIosPrompt(false);
    try {
      localStorage.setItem("vanvas_install_dismissed", "true");
    } catch {}
  };

  if (isStandalone || isDismissed || (!deferredPrompt && !isIos)) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 bg-[#FAF7F0] border-2 border-[#173B32]/30 rounded-2xl shadow-xl p-4 animate-slide-up flex items-center justify-between gap-3 text-[#20211D]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#173B32] text-[#FAF7F0] flex items-center justify-center shrink-0 shadow-xs">
            <Smartphone className="w-5 h-5 text-[#B49252]" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs text-[#173B32]">
              Install VANVAS App
            </h4>
            <p className="text-[11px] text-[#7B4D36] line-clamp-1">
              Add to Home Screen for offline access &amp; instant opening.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF7F0] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#B49252]" />
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-[#7B4D36] hover:text-[#173B32] hover:bg-[#E5D5BA]/40 cursor-pointer transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Instructions Sheet */}
      {showIosPrompt && (
        <div className="fixed inset-0 z-50 bg-[#0F2924]/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-[#20211D] animate-slide-up">
            <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#B65E3C]" />
                <h3 className="font-serif font-bold text-base text-[#173B32]">
                  Add to iPhone Home Screen
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosPrompt(false)}
                className="p-1 rounded-lg hover:bg-[#E5D5BA]/50 text-[#7B4D36]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#20211D]/80 font-sans">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#E5D5BA]">
                <div className="w-6 h-6 rounded-full bg-[#173B32] text-[#FAF7F0] flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </div>
                <div>
                  Tap the <strong className="text-[#173B32]">Share</strong> button in the Safari toolbar (<Share className="w-3.5 h-3.5 inline text-[#173B32] mb-0.5" />).
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#E5D5BA]">
                <div className="w-6 h-6 rounded-full bg-[#173B32] text-[#FAF7F0] flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </div>
                <div>
                  Scroll down and tap <strong className="text-[#173B32]">Add to Home Screen</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-[#173B32] mb-0.5" />).
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#E5D5BA]">
                <div className="w-6 h-6 rounded-full bg-[#173B32] text-[#FAF7F0] flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </div>
                <div>
                  Tap <strong className="text-[#173B32]">Add</strong> in top-right. VANVAS will launch as a full-screen app!
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2.5 rounded-xl bg-[#173B32] text-[#FAF7F0] text-xs font-mono font-bold hover:bg-[#20453B] transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
