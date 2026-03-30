import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { CommandBar } from "@/components/dashboard/CommandBar";
import { OverviewScreen } from "@/components/dashboard/screens/OverviewScreen";
import { ConversationsScreen } from "@/components/dashboard/screens/ConversationsScreen";
import { AgentsScreen } from "@/components/dashboard/screens/AgentsScreen";
import { MemoryScreen } from "@/components/dashboard/screens/MemoryScreen";
import { DevicesScreen } from "@/components/dashboard/screens/DevicesScreen";
import { AutomationsScreen } from "@/components/dashboard/screens/AutomationsScreen";
import { IntegrationsScreen } from "@/components/dashboard/screens/IntegrationsScreen";
import { SettingsScreen } from "@/components/dashboard/screens/SettingsScreen";
import { LLMProvidersScreen } from "@/components/dashboard/screens/LLMProvidersScreen";

const screens: Record<string, React.FC> = {
  overview: OverviewScreen,
  conversations: ConversationsScreen,
  "llm-providers": LLMProvidersScreen,
  agents: AgentsScreen,
  memory: MemoryScreen,
  devices: DevicesScreen,
  automations: AutomationsScreen,
  integrations: IntegrationsScreen,
  settings: SettingsScreen,
};

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [commandOpen, setCommandOpen] = useState(false);
  const toggleCommand = useCallback(() => setCommandOpen(prev => !prev), []);

  const ActiveScreen = screens[activeTab] || OverviewScreen;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Topbar onCommandOpen={toggleCommand} />

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <ActiveScreen />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <CommandBar open={commandOpen} onClose={toggleCommand} onSwitchToConversations={() => setActiveTab("conversations")} />
    </div>
  );
};

export default Index;
