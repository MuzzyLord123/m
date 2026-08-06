import { site } from "@/config/site";

/**
 * "Fresh off the brush" — the client updates this file rather than plugging in
 * a feed widget. No API token to expire, no third-party script, and the cards
 * are designed in the brand system instead of inheriting Instagram's chrome.
 * Each entry links out to the real post.
 */
export type SocialPost = {
  image: string;
  tone: string;
  caption: string;
  /** ISO date, rendered as a British date. */
  date: string;
  permalink: string;
  network: "instagram" | "facebook";
};

export const socialPosts: SocialPost[] = [
  {
    image: "/social/post-1.jpg",
    tone: "#827c73",
    caption: "Alcove units filled twice and primed. Flat colour shows every hollow, so this is where the time goes.",
    date: "2026-07-28",
    permalink: site.social.instagram,
    network: "instagram",
  },
  {
    image: "/social/post-2.jpg",
    tone: "#747170",
    caption: "Balustrade finished in a dark satin. New pine and an old newel, ending up as one piece.",
    date: "2026-07-21",
    permalink: site.social.instagram,
    network: "instagram",
  },
  {
    image: "/social/post-3.jpg",
    tone: "#6e5f56",
    caption: "Two full coats on textured render. It drinks the first one, so nobody should quote you for one.",
    date: "2026-07-14",
    permalink: site.social.facebook,
    network: "facebook",
  },
  {
    image: "/social/post-4.jpg",
    tone: "#87796b",
    caption: "Ochre going on over pale emulsion. Tinted primer first, or you are putting four coats on.",
    date: "2026-07-06",
    permalink: site.social.instagram,
    network: "instagram",
  },
  {
    image: "/social/post-5.jpg",
    tone: "#707f89",
    caption: "Every knot on a new pine staircase sealed before primer. Skip it and it bleeds through inside a year.",
    date: "2026-06-29",
    permalink: site.social.instagram,
    network: "instagram",
  },
  {
    image: "/social/post-6.jpg",
    tone: "#6f635a",
    caption: "Panelling caulked before a brush goes near it. The caulk line is the whole job.",
    date: "2026-06-22",
    permalink: site.social.facebook,
    network: "facebook",
  },
];
