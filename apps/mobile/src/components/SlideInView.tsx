import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleProp, ViewStyle } from "react-native";
import { useIsFocused } from "@react-navigation/native";

// Habit cards rise from the bottom of the screen into place, one after another.
// Tweak these to change the feel.
const START_OFFSET = Dimensions.get("window").height; // begin fully below the screen
const STAGGER_MS = 70; // delay between consecutive cards
const MAX_ANIMATED = 8; // only the first cards animate (see below)

interface Props {
  index: number; // position in the list, drives the stagger delay
  style?: StyleProp<ViewStyle>; // for layout the wrapper now owns, e.g. a grid cell's width
  children: React.ReactNode;
}

// Plays when the card first mounts and again every time its screen regains focus.
// Wrapped around habit cards only — never the date/progress headers above them,
// so those stay put.
export default function SlideInView({ index, style, children }: Props) {
  // FlatList mounts rows lazily while scrolling. Capping the animated rows keeps
  // a card that scrolls into view from flying up late with a long stagger delay.
  const animate = index < MAX_ANIMATED;
  const translateY = useRef(new Animated.Value(animate ? START_OFFSET : 0)).current;
  const opacity = useRef(new Animated.Value(animate ? 0 : 1)).current;

  // Tab screens stay mounted when you leave them, so a mount-only animation would
  // play once ever. Re-arm it on blur (while the screen is hidden, so there's no
  // visible flash) and play it each time the tab becomes active again.
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!animate) return;
    if (!isFocused) {
      translateY.setValue(START_OFFSET);
      opacity.setValue(0);
      return;
    }
    const delay = index * STAGGER_MS;
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        speed: 10,
        bounciness: 5,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 250, delay, useNativeDriver: true }),
    ]).start();
  }, [isFocused]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>
  );
}

// Lets a FlatList's renderItem body stay as-is: pass its index and the function
// that builds the card, and the card comes back wrapped in the animation.
export function slideIn(index: number, buildCard: () => React.ReactNode) {
  return <SlideInView index={index}>{buildCard()}</SlideInView>;
}
