import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, { Path } from "react-native-svg";

// SVG paths sourced from apps/web/public/Check square.svg and X square.svg

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Square path is split from the checkmark (and re-ordered to start at the top
// edge and sweep left/counterclockwise back to the top) so the two can be
// stroke-drawn one after another: square first, then the check, on mark-done.
const SQUARE_PATH = "M24 6 L10 6 Q6 6 6 10 L6 38 Q6 42 10 42 L38 42 Q42 42 42 38 L42 10 Q42 6 38 6 L24 6";
const CHECK_PATH = "M14 23L21 30L36 14";
// X strokes drawn one at a time: top-left -> bottom-right, then top-right -> bottom-left.
const X_STROKE_1 = "M14 14L34 34";
const X_STROKE_2 = "M34 14L14 34";
// Generous overestimates of each path's rendered length — only needs to be
// >= the actual length, since dashoffset just needs to fully clear the dash.
const SQUARE_LEN = 160;
const CHECK_LEN = 50;
const X_STROKE_LEN = 34;

export function CheckIcon({ size = 36 }: { size?: number }) {
  const squareProgress = useRef(new Animated.Value(0)).current;
  const checkProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(squareProgress, { toValue: 1, duration: 260, useNativeDriver: false }),
      Animated.timing(checkProgress, { toValue: 1, duration: 180, useNativeDriver: false }),
    ]).start();
  }, []);

  const squareDashoffset = squareProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [SQUARE_LEN, 0],
  });
  const checkDashoffset = checkProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CHECK_LEN, 0],
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <AnimatedPath
        d={SQUARE_PATH}
        stroke="#009951"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={SQUARE_LEN}
        strokeDashoffset={squareDashoffset}
      />
      <AnimatedPath
        d={CHECK_PATH}
        stroke="#009951"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={CHECK_LEN}
        strokeDashoffset={checkDashoffset}
      />
    </Svg>
  );
}

export function XIcon({ size = 36 }: { size?: number }) {
  const squareProgress = useRef(new Animated.Value(0)).current;
  const stroke1Progress = useRef(new Animated.Value(0)).current;
  const stroke2Progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(squareProgress, { toValue: 1, duration: 260, useNativeDriver: false }),
      Animated.timing(stroke1Progress, { toValue: 1, duration: 130, useNativeDriver: false }),
      Animated.timing(stroke2Progress, { toValue: 1, duration: 130, useNativeDriver: false }),
    ]).start();
  }, []);

  const squareDashoffset = squareProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [SQUARE_LEN, 0],
  });
  const stroke1Dashoffset = stroke1Progress.interpolate({
    inputRange: [0, 1],
    outputRange: [X_STROKE_LEN, 0],
  });
  const stroke2Dashoffset = stroke2Progress.interpolate({
    inputRange: [0, 1],
    outputRange: [X_STROKE_LEN, 0],
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <AnimatedPath
        d={SQUARE_PATH}
        stroke="#860000"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={SQUARE_LEN}
        strokeDashoffset={squareDashoffset}
      />
      <AnimatedPath
        d={X_STROKE_1}
        stroke="#860000"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={X_STROKE_LEN}
        strokeDashoffset={stroke1Dashoffset}
      />
      <AnimatedPath
        d={X_STROKE_2}
        stroke="#860000"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={X_STROKE_LEN}
        strokeDashoffset={stroke2Dashoffset}
      />
    </Svg>
  );
}
