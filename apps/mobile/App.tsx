import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { useAppUpdates } from './src/hooks/useAppUpdates';
import { useNotificationOnboarding } from './src/hooks/useNotificationOnboarding';

function AppContent() {
  useNotificationOnboarding();
  return <RootNavigator />;
}

export default function App() {
  useAppUpdates();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* The whole app is dark but app.json's userInterfaceStyle is "light" (changing
          it needs a native rebuild), so force light status-bar icons here instead —
          otherwise the clock/battery render dark-on-black. */}
      <StatusBar style="light" />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}