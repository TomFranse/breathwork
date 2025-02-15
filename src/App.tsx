import React from 'react';
import { Layout } from './components/common/Layout';
import { BreathingProvider } from './context/BreathingContext';
import { SettingsPage } from './components/settings/SettingsPage';
import { TimerPage } from './components/timer/TimerPage';
import { useBreathing } from './context/BreathingContext';

function AppContent() {
  const { state } = useBreathing();
  const { isActive } = state.session;

  return (
    <Layout>
      {isActive ? <TimerPage /> : <SettingsPage />}
    </Layout>
  );
}

function App() {
  return (
    <BreathingProvider>
      <AppContent />
    </BreathingProvider>
  );
}

export default App;
