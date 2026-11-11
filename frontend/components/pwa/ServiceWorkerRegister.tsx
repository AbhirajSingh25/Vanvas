"use client";

import { useEffect } from "react";
import {
  markControllerTransitionReloadTelemetry,
  updateNavigationDiagnostics,
} from "@/lib/navigationRecovery";

// Strictly in-memory per-document reload guard (resets cleanly after every reload)
let hasReloadedThisDocument = false;

async function queryWorkerCacheVersion(worker: ServiceWorker | null): Promise<string | null> {
  if (!worker || typeof MessageChannel === "undefined") return null;
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(null), 1200);
    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      resolve(event.data?.cacheVersion || null);
    };
    try {
      worker.postMessage({ type: "GET_DIAGNOSTICS" }, [channel.port2]);
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("serviceWorker" in navigator)) {
      updateNavigationDiagnostics({
        controllerState: "unsupported",
        activeWorkerState: null,
        waitingWorkerState: null,
      });
      return;
    }

    if (process.env.NODE_ENV === "production") {
      let reg: ServiceWorkerRegistration | null = null;
      // Record controller presence BEFORE registration so a fresh first-time install
      // does not unnecessarily trigger a page reload on initial clients.claim().
      let currentController: ServiceWorker | null = navigator.serviceWorker.controller;

      const syncDiagnostics = async (registration?: ServiceWorkerRegistration | null) => {
        const targetReg = registration || reg;
        const active = targetReg?.active || null;
        const waiting = targetReg?.waiting || null;
        const controller = navigator.serviceWorker.controller;
        let cacheVersion: string | null = null;
        if (controller) {
          cacheVersion = await queryWorkerCacheVersion(controller);
        } else if (active) {
          cacheVersion = await queryWorkerCacheVersion(active);
        }

        updateNavigationDiagnostics({
          controllerState: controller ? "controlled" : "uncontrolled",
          activeWorkerState: active?.state || null,
          waitingWorkerState: waiting?.state || null,
          ...(cacheVersion ? { cacheVersion } : {}),
        });
      };

      const activateWaitingWorker = (worker: ServiceWorker | null) => {
        if (!worker) return;
        try {
          worker.postMessage({ type: "SKIP_WAITING" });
        } catch {}
      };

      const handleControllerChange = () => {
        const hadExistingController = currentController !== null;
        currentController = navigator.serviceWorker.controller;

        syncDiagnostics().catch(() => {});

        if (hadExistingController && !hasReloadedThisDocument) {
          hasReloadedThisDocument = true;
          markControllerTransitionReloadTelemetry();
          window.location.reload();
        }
      };

      const handleVisibilityOrPageShow = () => {
        if (document.visibilityState === "visible" && reg) {
          reg.update().catch(() => {});
          syncDiagnostics(reg).catch(() => {});
        }
      };

      const wireInstallingWorker = (worker: ServiceWorker, registration: ServiceWorkerRegistration) => {
        worker.addEventListener("statechange", () => {
          syncDiagnostics(registration).catch(() => {});
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            activateWaitingWorker(worker);
          }
        });
      };

      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            reg = registration;
            if (!currentController && navigator.serviceWorker.controller) {
              currentController = navigator.serviceWorker.controller;
            }
            syncDiagnostics(registration).catch(() => {});

            if (registration.waiting && navigator.serviceWorker.controller) {
              activateWaitingWorker(registration.waiting);
            }

            if (registration.installing) {
              wireInstallingWorker(registration.installing, registration);
            }

            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              syncDiagnostics(registration).catch(() => {});
              if (newWorker) {
                wireInstallingWorker(newWorker, registration);
              }
            });
          })
          .catch((error) => {
            console.warn("[VANVAS PWA] Service worker registration failed:", error);
            updateNavigationDiagnostics({
              controllerState: "error",
              lastNavError: error instanceof Error ? error.message : String(error),
            });
          });
      };

      navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
      document.addEventListener("visibilitychange", handleVisibilityOrPageShow);
      window.addEventListener("pageshow", handleVisibilityOrPageShow);

      // Expose safe worker inspection/update actions for diagnostics mode (?debugNavigation=1)
      (window as any).__VANVAS_SW_CONTROL__ = {
        recheck: async () => {
          try {
            const currentReg = reg || (await navigator.serviceWorker.getRegistration("/"));
            if (currentReg) {
              reg = currentReg;
              await currentReg.update();
              await syncDiagnostics(currentReg);
            } else {
              await syncDiagnostics(null);
            }
          } catch {}
        },
        requestUpdate: async () => {
          try {
            const currentReg = reg || (await navigator.serviceWorker.getRegistration("/"));
            if (currentReg?.waiting) {
              activateWaitingWorker(currentReg.waiting);
            } else if (currentReg) {
              await currentReg.update();
              if (currentReg.waiting) {
                activateWaitingWorker(currentReg.waiting);
              }
            }
            await syncDiagnostics(currentReg || null);
          } catch {}
        },
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW, { once: true });
      }

      return () => {
        navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
        window.removeEventListener("load", registerSW);
        document.removeEventListener("visibilitychange", handleVisibilityOrPageShow);
        window.removeEventListener("pageshow", handleVisibilityOrPageShow);
      };
    } else {
      // Development safety: Unregister any stale worker to prevent dev caching
      updateNavigationDiagnostics({
        controllerState: "uncontrolled",
        cacheVersion: "dev-disabled",
      });
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {});
        }
      });
    }
  }, []);

  return null;
}
