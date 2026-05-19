import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the install button
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If the app is already installed, or running in standalone mode, hide the prompt
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    await deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User choice outcome: ${outcome}`);
    // We've used the prompt, and can't use it again, clear it
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-slate-900/95 backdrop-blur-md border border-sky-500/30 p-4 rounded-xl shadow-2xl z-[9999] transition-all duration-300 animate-bounce-subtle flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">Install BBMC DWLMS</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Add to your home screen for quick, offline-capable water level tracking.
            </p>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex justify-end gap-2 text-xs">
        <button 
          onClick={handleDismiss}
          className="px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Later
        </button>
        <button 
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
        >
          Install Now
        </button>
      </div>
    </div>
  );
};
