import { PUBLISHED_OWNER_PAGES } from "@/lib/owner-content";

const ifPublished = (key: (typeof PUBLISHED_OWNER_PAGES)[number], link: { label: string; href: string }) =>
  PUBLISHED_OWNER_PAGES.includes(key) ? [link] : [];

export type NavLink = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const NAV_LINKS: NavLink[] = [
  {
    label: "Get prayer",
    href: "/prayer-request/",
    children: [
      { label: "Prayer request", href: "/prayer-request/" },
      { label: "Healing request", href: "/healing-request/" },
      { label: "Deliverance request", href: "/deliverance-request/" },
      { label: "Dream interpretation request", href: "/dream-interpretation/" },
    ],
  },
  {
    label: "Ministries",
    href: "/online-deliverance/",
    children: [
      { label: "Online deliverance", href: "/online-deliverance/" },
      { label: "Marital settlement", href: "/marital-settlement/" },
      { label: "Healing", href: "/healing/" },
      { label: "Dream interpretation", href: "/dream-interpretation/" },
    ],
  },
  {
    label: "Watch and join",
    href: "/services/",
    children: [
      { label: "Services and Zoom", href: "/services/" },
      { label: "Media", href: "/media/" },
      { label: "Gallery", href: "/gallery/" },
      { label: "Testimonies", href: "/testimonies/" },
    ],
  },
  {
    label: "About",
    href: "/about/",
    children: [
      { label: "Our story", href: "/about/" },
      ...ifPublished("what-we-believe", { label: "What we believe", href: "/what-we-believe/" }),
      { label: "Leaders", href: "/leaders/" },
      { label: "Plan your visit", href: "/visit/" },
      { label: "Contact", href: "/contact/" },
    ],
  },
  {
    label: "Resources",
    href: "/blog/",
    children: [
      { label: "Articles", href: "/blog/" },
      { label: "Books", href: "/books/" },
      { label: "Store", href: "/store/" },
      { label: "FAQ", href: "/faq/" },
      { label: "How requests work", href: "/how-requests-work/" },
    ],
  },
  {
    label: "Give",
    href: "/give/",
    children: [
      { label: "Give", href: "/give/" },
      { label: "Partnership", href: "/partnership/" },
      ...ifPublished("where-gifts-go", { label: "Where gifts go", href: "/where-gifts-go/" }),
    ],
  },
];
