import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type AppConfig, type SystemStatus, type ServicesHealth } from "@/lib/api";

const DEFAULT_SERVICES: ServicesHealth = {
  brain: "offline",
  gateway: "offline",
  mongo: "disconnected",
  redis: "disconnected",
  qdrant: "disconnected",
};

interface AppConfigContextValue {
  status: SystemStatus["status"];
  mode: string;
  latency: number;
  config: AppConfig | undefined;
  /** Combined health for Brain, Gateway, Mongo, Redis, Qdrant (for status badges) */
  servicesHealth: ServicesHealth;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  updateConfig: (updates: { aiName?: string; responseStyle?: string; mode?: string }) => Promise<void>;
}

const DEFAULT_APP_CONFIG: AppConfigContextValue = {
  status: "offline",
  mode: "home",
  latency: 0,
  config: undefined,
  servicesHealth: DEFAULT_SERVICES,
  isLoading: true,
  error: null,
  refetch: () => {},
  updateConfig: async () => {},
};

const AppConfigContext = createContext<AppConfigContextValue | null>(null);

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [modeOverride, setModeOverride] = useState<string | null>(null);

  const { data: config, isLoading: configLoading, error: configError, refetch: refetchConfig } = useQuery({
    queryKey: ["config"],
    queryFn: () => api.getConfig(),
    staleTime: 30_000,
  });

  const effectiveMode = modeOverride ?? config?.mode ?? "home";

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ["systemStatus", effectiveMode],
    queryFn: () => api.getSystemStatus(effectiveMode),
    staleTime: 10_000,
    enabled: true,
  });

  const { data: servicesHealth, refetch: refetchServices } = useQuery({
    queryKey: ["servicesHealth"],
    queryFn: () => api.getServicesHealth(),
    staleTime: 10_000,
    enabled: true,
  });

  const refetch = useCallback(() => {
    refetchConfig();
    refetchStatus();
    refetchServices();
  }, [refetchConfig, refetchStatus, refetchServices]);

  const updateConfig = useCallback(
    async (updates: { aiName?: string; responseStyle?: string; mode?: string }) => {
      await api.updateConfig(updates);
      if (updates.mode !== undefined) setModeOverride(updates.mode);
      await queryClient.invalidateQueries({ queryKey: ["config"] });
      await queryClient.invalidateQueries({ queryKey: ["systemStatus"] });
    },
    [queryClient]
  );

  const value = useMemo<AppConfigContextValue>(
    () => ({
      status: status?.status ?? "offline",
      mode: effectiveMode,
      latency: status?.latency ?? 0,
      config,
      servicesHealth: servicesHealth ?? DEFAULT_SERVICES,
      isLoading: configLoading,
      error: configError as Error | null,
      refetch,
      updateConfig,
    }),
    [status, effectiveMode, config, servicesHealth, configLoading, configError, refetch, updateConfig]
  );

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig(): AppConfigContextValue {
  const ctx = useContext(AppConfigContext);
  if (!ctx) return DEFAULT_APP_CONFIG;
  return ctx;
}
