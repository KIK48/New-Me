import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HabitsScreen from "../screens/HabitsScreen";
import CreateHabitScreen from "../screens/CreateHabitScreen";
import { AppStack, AuthStack } from "./types";

const AuthNavigator = createNativeStackNavigator<AuthStack>();
const AppNavigator = createNativeStackNavigator<AppStack>();

export default function RootNavigator() {
  const { token } = useAuth();
  return (
    <NavigationContainer>
      {token ? (
        <AppNavigator.Navigator>
          <AppNavigator.Screen name="Habits" component={HabitsScreen} />
          <AppNavigator.Screen
            name="CreateHabit"
            component={CreateHabitScreen}
            options={{ title: "New Habit" }}
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
