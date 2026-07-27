import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Settings, Shield, BarChart3, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Small delay before showing banner
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem("cookie-consent", JSON.stringify(prefs));
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    const allAccepted = { essential: true, analytics: true, marketing: true };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const allRejected = { essential: true, analytics: false, marketing: false };
    setPreferences(allRejected);
    savePreferences(allRejected);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Cookie className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-semibold text-foreground leading-tight">
                        Cookie Preferences
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        We use cookies to enhance your experience
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 space-y-2">
                      {/* Essential */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">Essential Cookies</p>
                            <p className="text-sm text-muted-foreground">Required for the website to function</p>
                          </div>
                        </div>
                        <Switch checked={true} disabled />
                      </div>

                      {/* Analytics */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">Analytics Cookies</p>
                            <p className="text-sm text-muted-foreground">Help us improve our website</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.analytics}
                          onCheckedChange={(checked) =>
                            setPreferences((prev) => ({ ...prev, analytics: checked }))
                          }
                        />
                      </div>

                      {/* Marketing */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <Megaphone className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">Marketing Cookies</p>
                            <p className="text-sm text-muted-foreground">For personalised advertising</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.marketing}
                          onCheckedChange={(checked) =>
                            setPreferences((prev) => ({ ...prev, marketing: checked }))
                          }
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="px-4 py-3 border-t border-border bg-secondary/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link to="/privacy-policy" className="hover:text-primary transition-colors">
                      Privacy
                    </Link>
                    <span>•</span>
                    <Link to="/cookie-policy" className="hover:text-primary transition-colors">
                      Cookies
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                      className="gap-1.5 h-8 px-2 text-xs shrink-0"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRejectAll} className="h-8 px-3 text-xs min-w-0 flex-1 sm:flex-none">
                      Reject
                    </Button>
                    {showSettings ? (
                      <Button size="sm" onClick={handleSavePreferences} className="h-8 px-3 text-xs min-w-0 flex-1 sm:flex-none">
                        Save
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handleAcceptAll} className="h-8 px-3 text-xs min-w-0 flex-1 sm:flex-none">
                        Accept
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
