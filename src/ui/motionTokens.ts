import type { WithSpringConfig } from "react-native-reanimated";

/**
 * Gliding capsule — smooth, restrained overshoot. Controls the
 * horizontally sliding selection background in both segmented and bottom nav.
 */
export const CAPSULE_SPRING: WithSpringConfig = {
  damping: 22,
  stiffness: 200,
  mass: 1,
};

/**
 * Press feedback — immediate and tactile, returns to rest quickly.
 * Used for scale-down-on-press across all interactive nav items.
 */
export const PRESS_SPRING: WithSpringConfig = {
  damping: 15,
  stiffness: 400,
  mass: 0.8,
};

/**
 * Label / icon state transitions — calm, soft. Drives opacity and
 * color cross-fades between active and inactive states.
 */
export const LABEL_SPRING: WithSpringConfig = {
  damping: 20,
  stiffness: 180,
  mass: 1,
};

export const FOCUS_PROGRESS = {
  active: 1,
  inactive: 0,
} as const;

export const ITEM_OPACITY = {
  active: 1,
  inactive: 0.42,
} as const;

export const ITEM_CONTENT_SCALE = {
  active: 1,
  inactive: 0.93,
} as const;

export const PRESS_SCALE_DOWN = 0.88;
