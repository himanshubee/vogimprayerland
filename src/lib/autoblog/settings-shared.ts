// Types and constants shared by the admin screen (client) and the server.

export const FREQUENCIES = {
  daily: { label: "Every day", days: 1 },
  "every-2-days": { label: "Every 2 days", days: 2 },
  "twice-weekly": { label: "Twice a week", days: 3.5 },
  weekly: { label: "Once a week", days: 7 },
  fortnightly: { label: "Every 2 weeks", days: 14 },
  monthly: { label: "Once a month", days: 30 },
} as const;

export type Frequency = keyof typeof FREQUENCIES;

export type AutoblogSettings = {
  enabled: boolean;
  frequency: Frequency;
  /** Articles written on each run (1-3). */
  postsPerRun: number;
  /**
   * Publish straight to the site instead of saving a draft for review.
   * Off by default: unreviewed AI articles at volume are what Google's
   * scaled-content policy targets, and the site was demoted for exactly that.
   */
  autoPublish: boolean;
  /** Admin-entered topics, one per line; written before the built-in list. */
  topicQueue: string[];
  lastRunAt: string | null;
};

export const DEFAULT_AUTOBLOG: AutoblogSettings = {
  enabled: false,
  frequency: "weekly",
  postsPerRun: 1,
  autoPublish: false,
  topicQueue: [],
  lastRunAt: null,
};

export type AutoblogRun = {
  id: string;
  at: string;
  topic: string;
  status: "draft" | "published" | "skipped" | "failed";
  postId: string | null;
  slug: string | null;
  title: string | null;
  detail: string;
};
