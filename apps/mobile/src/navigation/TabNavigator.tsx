import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import HabitsScreen from "../screens/HabitsScreen";
import WeekScreen from "../screens/WeekScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SlidingIndicator from "../components/SlidingIndicator";
import { TAB_INDICATOR } from "../theme";
import { TabStack } from "./types";

const Tab = createBottomTabNavigator<TabStack>();

const ACTIVE_COLOR = "#98FF9D";
const INACTIVE_COLOR = "#3a7a5a";
const CIRCLE_SIZE = 38;
const CIRCLE_TOP = 5;

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

// Custom bar (instead of the default one) so a single circle can glide behind
// the active icon — the default bar has no hook for a shared moving element.
function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [rowWidth, setRowWidth] = useState(0);
  const itemWidth = rowWidth / state.routes.length;

  return (
    <View style={styles.bar}>
      {/* Measured on the inner row, not the bordered bar, so the width excludes the border */}
      <View style={styles.row} onLayout={(e: LayoutChangeEvent) => setRowWidth(e.nativeEvent.layout.width)}>
        {rowWidth > 0 && (
          <SlidingIndicator
            x={state.index * itemWidth + (itemWidth - CIRCLE_SIZE) / 2}
            style={styles.circle}
          />
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
          const label = typeof options.tabBarLabel === "string" ? options.tabBarLabel : route.name;

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          return (
            <TouchableOpacity key={route.key} style={styles.item} onPress={onPress} activeOpacity={0.7}>
              <View style={styles.iconSlot}>
                {options.tabBarIcon?.({ focused, color, size: 22 })}
              </View>
              <Text style={[styles.label, { color }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
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

// Same floating look as before: absolute, inset from the screen edges, green outline
const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 24,
    height: 64,
    backgroundColor: "#085331",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#98FF9D",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  row: {
    flex: 1,
    flexDirection: "row",
  },
  item: {
    flex: 1,
    alignItems: "center",
    paddingTop: CIRCLE_TOP,
  },
  // Fixed height equal to the circle so every icon centers inside it
  iconSlot: {
    height: CIRCLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
  },
  circle: {
    top: CIRCLE_TOP,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: TAB_INDICATOR,
  },
});
