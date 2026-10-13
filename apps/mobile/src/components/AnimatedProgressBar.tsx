import React, { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

interface Props {
  pct: number; // 0-100
  trackStyle: StyleProp<ViewStyle>;
  fillStyle: StyleProp<ViewStyle>;
}

// Fills from its previous value to the new pct instead of snapping instantly,
// so completing a habit reads as visible progress rather than a jump-cut.
export default function AnimatedProgressBar({ pct, trackStyle, fillStyle }: Props) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: pct,
      duration: 500,
      useNativeDriver: false, // width isn't a transform, can't use the native driver
    }).start();
  }, [pct]);

  return (
    <Animated.View style={trackStyle}>
      <Animated.View
        style={[
          fillStyle,
          {
            width: width.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </Animated.View>
  );
}
