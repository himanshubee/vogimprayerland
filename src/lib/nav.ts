export type NavLink = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Ministries",
    href: "/online-deliverance",
    children: [
      { label: "Online Deliverance", href: "/online-deliverance" },
      { label: "Marital Settlement", href: "/marital-settlement" },
      { label: "Dream Interpretation", href: "/dream-interpretation" },
      { label: "Healing", href: "/healing-request" },
    ],
  },
  {
    label: "Requests",
    href: "/prayer-request",
    children: [
      { label: "Prayer Request", href: "/prayer-request" },
      { label: "Healing Request", href: "/healing-request" },
      { label: "Dream Interpretation", href: "/dream-interpretation" },
      { label: "Deliverance Request", href: "/deliverance-request" },
    ],
  },
  { label: "Articles", href: "/blog" },
  { label: "Media", href: "/media" },
  { label: "Gallery", href: "/gallery" },
  {
    label: "Give",
    href: "/give",
    children: [
      { label: "Give", href: "/give" },
      { label: "Partnership", href: "/partnership" },
    ],
  },
  { label: "Contact", href: "/contact" },
];
