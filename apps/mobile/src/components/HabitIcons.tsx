import React from "react";
import Svg, { Path } from "react-native-svg";

// SVG paths sourced from apps/web/public/Check square.svg and X square.svg

export function CheckIcon({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M18 22L24 28L44 8M42 24V38C42 39.0609 41.5786 40.0783 40.8284 40.8284C40.0783 41.5786 39.0609 42 38 42H10C8.93913 42 7.92172 41.5786 7.17157 40.8284C6.42143 40.0783 6 39.0609 6 38V10C6 8.93913 6.42143 7.92172 7.17157 7.17157C7.92172 6.42143 8.93913 6 10 6H32"
        stroke="#009951"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function XIcon({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 49 49" fill="none">
      <Path
        d="M18.375 18.375L30.625 30.625M30.625 18.375L18.375 30.625M10.2083 6.125H38.7917C41.0468 6.125 42.875 7.95317 42.875 10.2083V38.7917C42.875 41.0468 41.0468 42.875 38.7917 42.875H10.2083C7.95317 42.875 6.125 41.0468 6.125 38.7917V10.2083C6.125 7.95317 7.95317 6.125 10.2083 6.125Z"
        stroke="#860000"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
