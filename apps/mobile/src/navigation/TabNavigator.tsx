import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import HabitsScreen from "../screens/HabitsScreen";
import WeekScreen from "../screens/WeekScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { TabStack } from "./types";

const Tab = createBottomTabNavigator<TabStack>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#98FF9D",
        tabBarInactiveTintColor: "#3a7a5a",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: 2,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "#085331",
          borderRadius: 20,
          marginHorizontal: 20,
          marginBottom: 24,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
          borderWidth: 1,
          borderColor: "#98FF9D",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: 10,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HabitsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Week"
        component={WeekScreen}
        options={{
          tabBarLabel: "Weekly",
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
