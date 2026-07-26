import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import CreateHabitScreen from "../screens/CreateHabitScreen";
import EditHabitScreen from "../screens/EditHabitScreen";
import HabitDetailScreen from "../screens/HabitDetailScreen";
import NotificationSettingsScreen from "../screens/NotificationSettingsScreen";
import TabNavigator from "./TabNavigator";
import { AppStack, AuthStack } from "./types";

const AuthNavigator = createNativeStackNavigator<AuthStack>();
const AppNavigator = createNativeStackNavigator<AppStack>();

export default function RootNavigator() {
  const { token } = useAuth();
  return (
    <NavigationContainer>
      {token ? (
        <AppNavigator.Navigator>
          {/* Tab bar lives here — CreateHabit/EditHabit slide on top, hiding the tabs */}
          <AppNavigator.Screen
            name="Tabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <AppNavigator.Screen
            name="CreateHabit"
            component={CreateHabitScreen}
            options={{
              presentation: "transparentModal",
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <AppNavigator.Screen
            name="EditHabit"
            component={EditHabitScreen}
            options={{ headerShown: false }}
          />
          <AppNavigator.Screen
            name="HabitDetail"
            component={HabitDetailScreen}
            options={{ headerShown: false }}
          />
          <AppNavigator.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
            options={{ headerShown: false }}
          />
        </AppNavigator.Navigator>
      ) : (
        <AuthNavigator.Navigator screenOptions={{ headerShown: false }}>
          <AuthNavigator.Screen name="Login" component={LoginScreen} />
          <AuthNavigator.Screen name="Register" component={RegisterScreen} />
        </AuthNavigator.Navigator>
      )}
    </NavigationContainer>
  );
}
