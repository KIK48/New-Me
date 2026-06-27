import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import HabitsScreen from "../screens/HabitsScreen";
import WeekScreen from "../screens/WeekScreen";
import { TabStack } from "./types";

const Tab = createBottomTabNavigator<TabStack>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { paddingBottom: 4 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HabitsScreen}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Week"
        component={WeekScreen}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>📅</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
