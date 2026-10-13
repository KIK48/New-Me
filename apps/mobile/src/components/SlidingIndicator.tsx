import React, { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

interface Props {
  x: number; // left offset to slide to, in px, inside the parent
  style: StyleProp<ViewStyle>; // size, position (top/bottom), color, radius
}

// A highlight that glides to its new spot instead of the active state jumping
// between items. Shared by the bottom tab bar and the Calendar view switcher.
export default function SlidingIndicator({ x, style }: Props) {
  const translateX = useRef(new Animated.Value(x)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Snap into place on mount — sliding in from the left edge on first paint looks like a glitch
    if (isFirstRender.current) {
      isFirstRender.current = false;
      translateX.setValue(x);
      return;
    }
    Animated.spring(translateX, {
      toValue: x,
      useNativeDriver: true,
      speed: 16,
      bounciness: 6,
    }).start();
  }, [x]);

  return (
    <Animated.View
      pointerEvents="none" // taps must reach the buttons underneath
      style={[{ position: "absolute", left: 0 }, style, { transform: [{ translateX }] }]}
    />
  );
}
