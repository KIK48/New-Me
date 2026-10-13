import React, { useEffect, useRef } from "react";
import { Animated, StyleProp, TextStyle } from "react-native";

interface Props {
  value: string | number; // changing this re-triggers the pop
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

// Small -> a little big -> back to normal, used for the calendar day-cursor
// label so moving between dates reads as a deliberate step, not a silent swap.
export default function PopOnChange({ value, style, children }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    scale.setValue(0.85);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
    ]).start();
  }, [value]);

  return (
    <Animated.Text style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.Text>
  );
}
