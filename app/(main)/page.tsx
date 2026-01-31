'use client';

import { useTabNavigation } from '@/hooks/useTabNavigation';
import { HomeTab, AnalyticsTab, UseAiAnalysisTab, MoreTab } from '@/components/tabs';
import { BottomNav } from '@/components/navigation';
import { StoreProvider } from '@/components/providers';

export default function MainPage() {
  const { activeTab, analyticsSubTab, setAnalyticsSubTab, handleTabChange } = useTabNavigation('home');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'analytics':
        return <AnalyticsTab subTab={analyticsSubTab} onSubTabChange={setAnalyticsSubTab} />;
      case 'ai-analysis':
        return <UseAiAnalysisTab />;
      case 'more':
        return <MoreTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <StoreProvider>
      {renderTabContent()}
      <BottomNav activeTab={activeTab} analyticsSubTab={analyticsSubTab} onTabChange={handleTabChange} />
    </StoreProvider>
  );
}
