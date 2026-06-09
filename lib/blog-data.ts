export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: number;
  date: string;
  author: string;
  content: string;
}

export const categories = [
  { id: "all", label: "All Posts" },
  { id: "guides", label: "Guides" },
  { id: "technology", label: "Technology" },
  { id: "tips", label: "Tips & Tricks" },
  { id: "reviews", label: "Reviews" },
  { id: "news", label: "News" },
];

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-improve-internet-speed",
    title: "How to Improve Your Internet Speed: 12 Proven Methods",
    excerpt:
      "From optimizing your router placement to upgrading firmware, these actionable steps can significantly boost your connection.",
    category: "guides",
    readingTime: 8,
    date: "2026-05-20",
    author: "Alex Kim",
    content: "Full content here...",
  },
  {
    slug: "fiber-internet-explained",
    title: "Fiber Internet Explained: Why It's the Gold Standard",
    excerpt:
      "Fiber optic connections offer symmetrical speeds and near-zero latency. Here's how the technology works and whether it's available in your area.",
    category: "technology",
    readingTime: 6,
    date: "2026-05-15",
    author: "Sarah Chen",
    content: "Full content here...",
  },
  {
    slug: "best-wifi-tips-2025",
    title: "10 Wi-Fi Tips That Will Transform Your Home Network",
    excerpt:
      "Stop blaming your ISP. These Wi-Fi optimization techniques can double your wireless speeds without spending a cent.",
    category: "tips",
    readingTime: 5,
    date: "2026-05-10",
    author: "Marcus T.",
    content: "Full content here...",
  },
  {
    slug: "understanding-ping-and-latency",
    title: "Ping vs Latency vs Jitter: What's the Difference?",
    excerpt:
      "These three metrics all describe your connection's responsiveness, but they measure different things. Understanding each helps you diagnose real problems.",
    category: "technology",
    readingTime: 7,
    date: "2026-05-05",
    author: "Alex Kim",
    content: "Full content here...",
  },
  {
    slug: "best-isps-2025",
    title: "Best ISPs of 2026: Ranked by Real User Speed Tests",
    excerpt:
      "We analyzed 50 million speed tests to rank the top internet service providers by actual delivered performance.",
    category: "reviews",
    readingTime: 10,
    date: "2026-04-28",
    author: "Sarah Chen",
    content: "Full content here...",
  },
  {
    slug: "what-internet-speed-do-i-need",
    title: "What Internet Speed Do You Actually Need in 2026?",
    excerpt:
      "4K streaming, remote work, gaming, smart home — here's exactly how much bandwidth each use case requires, with no overselling.",
    category: "guides",
    readingTime: 6,
    date: "2026-04-20",
    author: "Marcus T.",
    content: "Full content here...",
  },
];
