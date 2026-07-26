import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}