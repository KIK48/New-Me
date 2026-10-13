import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import HabitsScreen from "../screens/HabitsScreen";
import WeekScreen from "../screens/WeekScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { TabStack } from "./types";

const Tab = createBottomTabNavigator<TabStack>();

// Animates the tab icon scale on focus change, since react-navigation
// swaps color instantly but gives no built-in transition for the icon itself.
function AnimatedTabIcon({
  name,
  color,
  size,
  focused,
}: {
  name: React.ComponentProps<typeof Feather>["name"];
  color: string;
  size: number;
  focused: boolean;
}) {
  const scale = useRef(new Animated.Value(focused ? 1.15 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Feather name={name} size={size} color={color} />
    </Animated.View>
  );
}

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
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="home" size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Week"
        component={WeekScreen}
        options={{
          tabBarLabel: "Calendar",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="calendar" size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="user" size={size} color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
