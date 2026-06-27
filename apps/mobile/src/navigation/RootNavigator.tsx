import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import CreateHabitScreen from "../screens/CreateHabitScreen";
import EditHabitScreen from "../screens/EditHabitScreen";
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
            options={{ title: "New Habit" }}
          />
          <AppNavigator.Screen
            name="EditHabit"
            component={EditHabitScreen}
            options={{ title: "Edit Habit" }}
          />
        </AppNavigator.Navigator>
      ) : (
        <AuthNavigator.Navigator>
          <AuthNavigator.Screen name="Login" component={LoginScreen} />
          <AuthNavigator.Screen name="Register" component={RegisterScreen} />
        </AuthNavigator.Navigator>
      )}
    </NavigationContainer>
  );
}
