import { PortfolioItem, ProfileData, ServiceItem } from "./types";

export const DEFAULT_PROFILE: ProfileData = {
  name: "Goodness Daodu",
  title: "Figma & Webflow Developer",
  location: "Lagos, Nigeria",
  phone: "+2348148778176",
  email: "goodnessdaodu940@gmail.com",
  aboutText: "I work alone, offering direct hands-on creative execution as well as specialized design systems and Webflow consultation. I architect premium UI libraries, custom interactive prototypes, fully responsive screen grids, and pixel-perfect layouts. Every pixel and element is customized to build high-performance web assets that reinforce your digital product value. I help ambitious startups and established companies turn complex ideas into refined, modern digital applications.",
  consultationRate: 10,
  consultationSub: "per 35-minute strategic mapping session",
  heroImage: "/src/assets/images/hero_consultation_1781474808969.jpg",
  profileImage: "/src/assets/images/goodness_portrait_1781474792110.jpg"
};

export const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: "srv-1",
    title: "High-Fidelity Figma UI Kits & Systems",
    description: "Responsive multi-breakpoint design grids, interactive high-fidelity prototype flows, reusable semantic styles, and a comprehensive library of custom design tokens.",
    iconName: "Sparkles",
    price: "$250+"
  },
  {
    id: "srv-2",
    title: "Responsive Webflow Development",
    description: "Flawless screen setups from your custom wireframes, pixel-perfect responsive styling across all core breakpoints, interactive animations, and dynamic collections.",
    iconName: "PenTool",
    price: "$200+"
  },
  {
    id: "srv-3",
    title: "Full-Stack Webflow Portfolio Deployment",
    description: "Complete end-to-end service combining precision visual space mapping in Figma with production-ready Webflow execution. SEO-tuned and client-ready.",
    iconName: "Package",
    price: "$400+"
  },
  {
    id: "srv-4",
    title: "Creative Collaboration & Strategy Map",
    description: "A comprehensive 1-on-1 strategic consulting session. We dive deep into layout structures, responsive curves, content architecture, and optimization paths.",
    iconName: "HelpCircle",
    price: "Secure Consultation"
  }
];

export const DEFAULT_PORTFOLIO: PortfolioItem[] = [
  {
    id: "port-figma-1",
    title: "Apex FinTech Brand Architecture & UI Kit",
    category: "Branding (Figma)",
    style: "Technical & Clean",
    tags: ["Figma Kit", "Brand Guidelines", "Design Tokens"],
    imageUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=800",
    description: "A high-fidelity Figma workspace featuring dynamic typography charts, color-safe semantic variables, and a robust library of nested design tokens.",
    client: "Apex Labs",
    year: "2026",
    featured: true,
    longDescription: "This case study details the complete visual alignment and design system engineered for Apex Labs in Figma. Utilizing Figma variables to map spacing, colors, and layout scales across multiple breakpoints, this structure has reduced screen delivery times by over 45% for their engineering team. Highly structured, editable, and perfect for startup scale.",
    figmaLink: "https://www.figma.com/community/file/1121065757731776566",
    liveUrl: "https://www.untitledui.com"
  },
  {
    id: "port-figma-2",
    title: "Acme Web3 Layout Grids & Design Tokens",
    category: "Branding (Figma)",
    style: "Bold & Modern",
    tags: ["Figma Component", "SaaS Grid"],
    imageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800",
    description: "Pixel-perfect Figma asset library styled with interactive states, dark theme modifiers, and auto-layout responsive setups.",
    client: "Acme Capital",
    year: "2026",
    featured: true,
    longDescription: "A custom UI grid made available to Acme Capital's design team. Hand-built from mathematical scale curves to establish an immediate tech-pioneer visual tone. Includes icons, header templates, cards, and modal components.",
    figmaLink: "https://www.figma.com/community/file/1170505432923984189",
    liveUrl: "https://tokens.studio"
  },
  {
    id: "port-app-1",
    title: "HealFlow - Mobile Patient Consultation Flow",
    category: "App Design",
    style: "Minimalist & Elegant",
    tags: ["App UI", "User Flow", "Mobile Design"],
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
    description: "Mobile client application optimizing remote clinical check-ins and visual prescription boards.",
    client: "HealFlow Corp",
    year: "2026",
    featured: true,
    longDescription: "A premium mobile visual interface built to minimize clinic-side friction. Centered on clean off-white containers, comfortable text-sizing, and helpful micro-states to support patients during critical consultation moments. Highly responsive and tested on real mobile viewport frames.",
    figmaLink: "https://www.figma.com/community/file/1131154439169642398"
  },
  {
    id: "port-app-2",
    title: "AstroPay - Multichain Asset Trading Hub",
    category: "App Design",
    style: "Technical & Clean",
    tags: ["Fintech App", "Crypto UI", "Modern Dashboard"],
    imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&q=80&w=800",
    description: "High-definition interface sketches for a mobile asset trading hub and multichain ledger wallet.",
    client: "Astro Ecosystem",
    year: "2025",
    featured: false,
    longDescription: "A dark-toned, geometric design blueprint focused on clarity and precision. Solves key visibility challenges in multi-wallet management, providing clear data visualizations and transaction tables designed for speedy reading.",
    figmaLink: "https://www.figma.com/community/file/1199341695276535544"
  },
  {
    id: "port-screen-1",
    title: "DriveSync - Tablet Terminal Routing Screens",
    category: "App Screenshots",
    style: "Technical & Clean",
    tags: ["Route HUD", "Terminal Design", "Transit System"],
    imageUrl: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=800",
    description: "Interactive product screenshots designed for driver tablet terminals, featuring night-mode tracking arrays.",
    client: "DriveSync Logistics",
    year: "2026",
    featured: true,
    longDescription: "Real high-resolution screen designs from the live DriveSync tablet applications. Showcases transit loops, freight load balances, and automated GPS-grounded route planning assets tailored for high-glare environments. Clear visual hierarchy tailored for real-world usage.",
    figmaLink: "https://www.figma.com/community/file/1132644788192667352"
  },
  {
    id: "port-screen-2",
    title: "PulseFit - Isometric Activity Tracking Screens",
    category: "App Screenshots",
    style: "Bold & Modern",
    tags: ["Metric HUD", "Activity Logs", "App Mockup"],
    imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=800",
    description: "Tactile dashboard captures that monitor live biometrics and custom workout streaks.",
    client: "PulseFit Inc",
    year: "2026",
    featured: false,
    longDescription: "A gorgeous compilation of user-facing dashboard layers illustrating live user progress benchmarks and activity charts, using neon-accented dark designs with generous layout padding.",
    figmaLink: "https://www.figma.com/community/file/1020739818816439061"
  },
  {
    id: "port-webflow-1",
    title: "Vapor - Web3 Crypto Protocol Landing Page",
    category: "Webflow Web Design",
    style: "Minimalist & Elegant",
    tags: ["Webflow Template", "Startup Web", "SaaS Landing"],
    imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800",
    description: "A high-performance startup website with minimalist display typography, buttery smooth layout triggers, and bright layouts.",
    client: "Vapor Protocol",
    year: "2026",
    featured: true,
    longDescription: "A modern, bright luxury Webflow page built to drive venture investor engagement. Captures the startup's brand narrative perfectly through a spacious hero, subtle gradient backgrounds, an interactive pricing table, and custom responsive assets.",
    figmaLink: "https://www.figma.com/community/file/1131102558661739502"
  },
  {
    id: "port-webflow-2",
    title: "Kure Organics - Skincare Marketplace",
    category: "Webflow Web Design",
    style: "Warm & Organic",
    tags: ["Webflow Store", "Tactile Layout", "Skincare Web"],
    imageUrl: "https://images.unsplash.com/photo-1608248597481-496100c8c836?auto=format&fit=crop&q=80&w=800",
    description: "An organic luxury skincare marketplace built on Webflow, with beautiful typography and cozy graphic details.",
    client: "Kure Co",
    year: "2025",
    featured: true,
    longDescription: "A visually cozy boutique workspace showcasing sustainable botanical items. Utilizes a warm, creamy color theme, high-contrast serif headers, and asymmetric product grids. The catalog loads lightning fast even with high-definition assets.",
    figmaLink: "https://www.figma.com/community/file/1105151528413627493"
  },
  {
    id: "port-logo-1",
    title: "Vertex Audio - Strategic Logomark Project",
    category: "Logo Design",
    style: "Bold & Modern",
    tags: ["Logo", "App Mark", "Geometric Logo"],
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800",
    description: "A beautifully aligned logo vector expressing premium sonic quality, designed to scale down to a 16px tab icon.",
    client: "Vertex Audio",
    year: "2026",
    featured: false,
    longDescription: "A custom logo research and asset deliverable for Vertex Audio. Crafted from geometric alignments on a strict grid structure to ensure identical density on premium app badges, frosted merchandise print, and huge retail banners.",
    figmaLink: "https://www.figma.com/community/file/1149831938883556754"
  },
  {
    id: "port-pack-1",
    title: "Nectar Brew - Cold Coffee Can Packaging",
    category: "Packaging Design",
    style: "Warm & Organic",
    tags: ["Can Design", "Luxury Label", "Coffee Print"],
    imageUrl: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=800",
    description: "Luxury aluminum can labels styled with botanical illustration blocks and cozy coffee tones.",
    client: "Nectar Brew Co",
    year: "2026",
    featured: true,
    longDescription: "Artistic, highly tactile packaging crafted using illustrative patterns inspired by original coffee farm foliage. Perfectly communicates handmade specialty beverage status, utilizing earth colors and cozy branding tags.",
    figmaLink: "https://www.figma.com/community/file/1138831938883556755",
    liveUrl: "https://www.behance.net/gallery/135123985/Nectar-Brew-Packaging-Design"
  }
];

export const CATEGORIES = [
  "All Scope",
  "Branding (Figma)",
  "App Design",
  "App Screenshots",
  "Webflow Web Design",
  "Logo Design",
  "Packaging Design"
];

export const STYLE_FILTERS = [
  "All Styles",
  "Technical & Clean",
  "Minimalist & Elegant",
  "Warm & Organic",
  "Bold & Modern",
  "Classic & Bookish"
];
