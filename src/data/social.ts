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
    image: "/social/post-1.png",
    tone: "#c3ccc9",
    caption: "Second coat going on in Frodsham. Cutting in by hand, no tape on the coving.",
    date: "2026-07-28",
    permalink: site.social.instagram,
    network: "instagram",
  },
  {
    image: "/social/post-2.png",
    tone: "#b9ae9f",
    caption: "Fifty-eight spindles masked up. The spraying takes an hour, this took a day.",
    date: "2026-07-21",
    permalink: site.social.instagram,
    network: "instagram",
  },
  {
    image: "/social/post-3.png",
    tone: "#cfd3d8",
    caption: "Render repairs done and sealed before the masonry coats go on in Chester.",
    date: "2026-07-14",
    permalink: site.social.facebook,
    network: "facebook",
  },
  {
    image: "/social/post-4.png",
    tone: "#c8bcb4",
    caption: "Twelve drops, no repeat. Planned on paper before the first one went up.",
    date: "2026-07-06",
    permalink: site.social.instagram,
    network: "instagram",
  },
  {
    image: "/social/post-5.png",
    tone: "#aab3a4",
    caption: "Kitchen doors racked and drying. Back on their hinges Thursday.",
    date: "2026-06-29",
    permalink: site.social.instagram,
    network: "instagram",
  },
  {
    image: "/social/post-6.png",
    tone: "#d5c9b6",
    caption: "Sash window sills spliced rather than replaced. Cheaper and it keeps the original timber.",
    date: "2026-06-22",
    permalink: site.social.facebook,
    network: "facebook",
  },
];
