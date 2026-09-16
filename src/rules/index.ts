import { FACEBOOK_RULES } from "./facebook";
import { INSTAGRAM_RULES } from "./instagram";
import { REDDIT_RULES } from "./reddit";
import { TIKTOK_RULES } from "./tiktok";
import type { HostRules } from "./types";
import { X_RULES } from "./x";
import { YOUTUBE_RULES } from "./youtube";

export * from "./types";

/**
 * Single source of truth for feed hiding. Everything else derives from this
 * list: the CSS the content script injects, the selector-rot check, the
 * manifest host-permission consistency test, and the fixture e2e.
 */
export const HOST_RULES: readonly HostRules[] = [
  X_RULES,
  FACEBOOK_RULES,
  INSTAGRAM_RULES,
  YOUTUBE_RULES,
  REDDIT_RULES,
  TIKTOK_RULES
];
