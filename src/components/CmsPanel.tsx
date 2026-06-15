import React, { useState, useEffect } from "react";
import { PortfolioItem, ProfileData, ServiceItem } from "../types";
import { 
  X, Save, Trash2, Plus, RefreshCw, Edit, Sparkles, Image, Check, Info, LogOut, Calendar, Clock, Mail
} from "lucide-react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";

interface CmsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileData;
  onUpdateProfile: (data: ProfileData) => Promise<void> | void;
  portfolioItems: PortfolioItem[];
  onAddPortfolioItem: (item: PortfolioItem) => Promise<void> | void;
  onDeletePortfolioItem: (id: string) => Promise<void> | void;
  onUpdatePortfolioItem: (item: PortfolioItem) => Promise<void> | void;
  services: ServiceItem[];
  onUpdateService: (service: ServiceItem) => Promise<void> | void;
  onReset: () => void;
}

// Sub-component to manage individual service package editing and avoid saving on every keystroke
interface ServiceItemFormProps {
  service: ServiceItem;
  onUpdateService: (service: ServiceItem) => Promise<void> | void;
  idx: number;
}

const ServiceItemForm: React.FC<ServiceItemFormProps> = ({ service, onUpdateService, idx }) => {
  const [title, setTitle] = useState(service.title);
  const [price, setPrice] = useState(service.price);
  const [description, setDescription] = useState(service.description);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if service data resets or updates in back-end snapshot
  useEffect(() => {
    setTitle(service.title);
    setPrice(service.price);
    setDescription(service.description);
  }, [service]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onUpdateService({ ...service, title, price, description });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2500);
    } catch (err: any) {
      console.error("Failed to save service package:", err);
      try {
        const parsed = JSON.parse(err.message);
        setErrorMsg(parsed.error || err.message);
      } catch {
        setErrorMsg(err.message || String(err));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = title !== service.title || price !== service.price || description !== service.description;

  return (
    <div className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white shadow-xs">
      <div className="flex justify-between items-center bg-slate-50 -m-4 mb-3 p-3 rounded-t-lg border-b border-slate-100">
        <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">
          Service Package {idx + 1}
        </span>
        <input 
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="text-right font-display font-black text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-900 focus:outline-hidden max-w-[120px] focus:border-slate-400"
          placeholder="e.g. $100+"
        />
      </div>

      <div className="space-y-3 pt-1">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-display font-semibold text-sm text-slate-950 border border-slate-200 rounded-md px-3 py-1.5 focus:border-slate-400 focus:outline-hidden bg-white"
            placeholder="Service Title"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs text-slate-700 border border-slate-200 rounded-md px-3 py-1.5 focus:border-slate-400 focus:outline-hidden bg-white"
            placeholder="Package Details"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="text-[10px] font-mono text-red-600 bg-red-50 p-2.5 rounded border border-red-100 leading-relaxed font-semibold">
          Cloud Write Warning: {errorMsg}
        </div>
      )}

      <div className="flex justify-between items-center pt-1">
        <span className="text-[10px] text-slate-400 italic">
          {hasChanges ? "Has unsaved edits" : "Synced to cloud"}
        </span>
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer select-none ${
            isSuccess 
              ? "bg-emerald-500 text-white" 
              : hasChanges 
                ? "bg-slate-900 hover:bg-slate-800 text-white" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isSaving ? (
            "Saving..."
          ) : isSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" /> Saved!
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" /> Save Package
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default function CmsPanel({
  isOpen,
  onClose,
  profileData,
  onUpdateProfile,
  portfolioItems,
  onAddPortfolioItem,
  onDeletePortfolioItem,
  onUpdatePortfolioItem,
  services,
  onUpdateService,
  onReset
}: CmsPanelProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "portfolio" | "services" | "bookings">("profile");

  // Local state for profile edits
  const [profileForm, setProfileForm] = useState<ProfileData>({ ...profileData });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Local state for consultations/bookings
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (activeTab !== "bookings") return;
    setLoadingBookings(true);
    const q = query(collection(db, "consultations"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setBookingsList(list);
      setLoadingBookings(false);
    }, (error) => {
      console.error("Error loading consultations:", error);
      setLoadingBookings(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this booking?")) {
      try {
        await deleteDoc(doc(db, "consultations", id));
      } catch (err) {
        console.error("Failed to delete booking:", err);
        alert("Could not delete lead from Cloud Firestore.");
      }
    }
  };

  // Sync profile form when live data updates are received from the cloud database
  useEffect(() => {
    setProfileForm({ ...profileData });
  }, [profileData]);

  // Local state for adding portfolio item
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Branding (Figma)");
  const [newItemStyle, setNewItemStyle] = useState("Minimalist & Elegant");
  const [newItemTags, setNewItemTags] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemClient, setNewItemClient] = useState("");
  const [newItemYear, setNewItemYear] = useState("2026");
  const [newItemFigmaLink, setNewItemFigmaLink] = useState("");
  const [newItemLiveUrl, setNewItemLiveUrl] = useState("");
  const [newItemLongDesc, setNewItemLongDesc] = useState("");

  // Pre-curated blueprint options for rapid creative prototyping and catalog seeding
  const catalogBlueprints = [
    {
      name: "Prism (Figma UI Kit)",
      title: "Prism Token-Centric Design Workspace System",
      category: "Branding (Figma)",
      style: "Technical & Clean",
      tags: "Figma Variables, Design System, Component Library, Grid Tokens",
      imageUrl: "https://images.unsplash.com/photo-1541462608141-2ff68a965d78?auto=format&fit=crop&q=80&w=800",
      desc: "An enterprise token-centric Figma workspace system designed for ultra-fast scaling, elastic container setups, and multi-mode theme matrices.",
      client: "Prism Systems Corp",
      year: "2026",
      figmaLink: "https://figma.com",
      liveUrl: "https://prism-systems.webflow.io",
      longDesc: "A complex design system deliverable exploring multi-breakpoint variable alignments in Figma. It integrates customized font scales paired with JetBrains Mono code indices, deep borders, and cohesive hover assets."
    },
    {
      name: "Sienna (Webflow CMS)",
      title: "Sienna Botanics - Warm Tactile Storefront",
      category: "Webflow Web Design",
      style: "Warm & Organic",
      tags: "Webflow Commerce, Asymmetric Grids, Cream Shaders, Micro-triggers",
      imageUrl: "https://images.unsplash.com/photo-1608248597481-496100c8c836?auto=format&fit=crop&q=80&w=800",
      desc: "An elegant, cream-shaded botanical e-commerce showcase developed with custom responsive filters and cozy visual typography.",
      client: "Sienna Labs",
      year: "2026",
      figmaLink: "https://figma.com",
      liveUrl: "https://sienna-botanics.webflow.io",
      longDesc: "Full-scale multi-breakpoint responsive assembly from Figma high-fidelity outlines. This Webflow landing features cozy beige backdrops, clean serif titles, asymmetric layout cards, and buttery-smooth canvas transition micro-interactions."
    },
    {
      name: "Apex FinTech (Dashboard)",
      title: "Apex HUD - FinTech Transaction Grid",
      category: "App Design",
      style: "Bold & Modern",
      tags: "Crypto UI, Dark HUD, SVG Analytics, Figma Auto Layout",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
      desc: "A futuristic dark-mode telemetry financial interface centering on neon interactive widgets, nested buttons, and compact telemetry cells.",
      client: "Apex Ledger",
      year: "2026",
      figmaLink: "https://figma.com",
      liveUrl: "https://apex-ledger.webflow.io",
      longDesc: "A complete mobile app outline optimizing visual telemetry density. Features custom chart canvases, custom dark theme tokens, interactive variant lists, and clean rounded card elements ready to translate directly to React."
    },
    {
      name: "Aura Breath (iOS Mobile)",
      title: "Aura - Mindfulness & Ambient Sound App",
      category: "App Screenshots",
      style: "Minimalist & Elegant",
      tags: "iOS Screenshots, Minimalist UI, Breath Pacing, Negative Space",
      imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800",
      desc: "A pure slate-themed iOS screen flow for visual meditation, tactile haptics, and pacing loops.",
      client: "Aura Breath Co",
      year: "2025",
      figmaLink: "https://figma.com",
      liveUrl: "https://aura-mind.webflow.io",
      longDesc: "Demonstrates high-fidelity layout mastery. It utilizes expansive margin padding, deep off-white palettes, thin card boardlines, and highly readable space-grotesk indicators."
    }
  ];

  // Local presets for Unsplash design mockups to make it easy to choose high resolution imagery
  const imagePresets = [
    { name: "Brand Flatlay", url: "https://images.unsplash.com/photo-1541462608141-2ff68a965d78?auto=format&fit=crop&q=80&w=800" },
    { name: "Skincare Packaging", url: "https://images.unsplash.com/photo-1608248597481-496100c8c836?auto=format&fit=crop&q=80&w=800" },
    { name: "Coffee Notebook", url: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=800" },
    { name: "Color Spectrum", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800" },
    { name: "Studio Workspace", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800" },
    { name: "Modern Editorial", url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800" },
  ];

  if (!isOpen) return null;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      await onUpdateProfile(profileForm);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch (err: any) {
      console.error("Profile save failed:", err);
      try {
        const parsed = JSON.parse(err.message);
        setSaveError(parsed.error || err.message);
      } catch {
        setSaveError(err.message || String(err));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    setIsSaving(true);
    setSaveError(null);

    const tagsArr = newItemTags
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const defaultUrl = newItemUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800";

    const newItem: PortfolioItem = {
      id: "port-" + Date.now(),
      title: newItemTitle,
      category: newItemCategory,
      style: newItemStyle,
      tags: tagsArr.length > 0 ? tagsArr : ["Design", newItemCategory],
      imageUrl: defaultUrl,
      description: newItemDesc || "A premium digital design project executed with extreme attention to detail.",
      longDescription: newItemLongDesc.trim() || newItemDesc || "A premium digital design project executed with extreme attention to detail.",
      figmaLink: newItemFigmaLink.trim() || undefined,
      liveUrl: newItemLiveUrl.trim() || undefined,
      client: newItemClient || "Independent Freelance",
      year: newItemYear || "2026",
      featured: true
    };

    try {
      await onAddPortfolioItem(newItem);

      // Reset fields only on successful write
      setNewItemTitle("");
      setNewItemTags("");
      setNewItemUrl("");
      setNewItemDesc("");
      setNewItemClient("");
      setNewItemYear("2026");
      setNewItemFigmaLink("");
      setNewItemLiveUrl("");
      setNewItemLongDesc("");

      alert(`Successfully added "${newItem.title}" to your portfolio!`);
    } catch (err: any) {
      console.error("Add item failed:", err);
      try {
        const parsed = JSON.parse(err.message);
        setSaveError(parsed.error || err.message);
      } catch {
        setSaveError(err.message || String(err));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300"
      id="cms-modal-overlay"
    >
      <div 
        className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full animate-fade-in border-l border-slate-100"
        id="cms-panel-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="p-1 px-1.5 bg-sky-500 rounded text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              CMS Hub
            </span>
            <h2 className="text-lg font-semibold font-display">Portfolio Customizer</h2>
          </div>
          <div className="flex items-center gap-3">
            {auth.currentUser && (
              <button
                onClick={async () => {
                  try {
                    await signOut(auth);
                    alert("Logged out of Google Admin session.");
                    onClose();
                  } catch (e: any) {
                    console.error("Sign out error", e);
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-red-400 text-xs transition-colors"
                title="Sign Out Admin Account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-mono uppercase tracking-wider">Sign Out</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === "profile" 
                ? "bg-white text-slate-900 shadow-xs" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === "portfolio" 
                ? "bg-white text-slate-900 shadow-xs" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Portfolio Catalog ({portfolioItems.length})
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === "services" 
                ? "bg-white text-slate-900 shadow-xs" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Rates & Services
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === "bookings" 
                ? "bg-white text-slate-900 shadow-xs" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Leads & Bookings
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {saveError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1.5 animate-fade-in shrink-0">
              <p className="font-semibold flex items-center gap-1.5 text-red-900">
                <Info className="w-4 h-4 text-red-600" /> Cloud Sync Protection
              </p>
              <p className="text-[11px] leading-relaxed opacity-95 text-red-700">
                Your changes are active locally in your current browser, but they could not be synced permanently to the Firestore cloud database: <code className="bg-red-100/50 px-1 py-0.5 rounded font-mono font-bold text-[10px] break-all">{saveError}</code>.
              </p>
              <p className="text-[11px] leading-relaxed text-red-700">
                To guarantee everyone else can see your changes on any other device, please make sure you open this app in a **New Tab** and sign in using the **Sign in with Google** button (using your administrator email <code className="bg-red-100/50 px-1 rounded font-mono">daodugoodness01@gmail.com</code>).
              </p>
              <button 
                type="button" 
                onClick={() => setSaveError(null)} 
                className="text-[10px] font-bold font-mono text-red-600 hover:text-red-800 underline uppercase tracking-wider"
              >
                Dismiss Connection Warning
              </button>
            </div>
          )}
          
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 text-xs text-sky-800 flex gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Live Editable Workspace</p>
                  <p>Changes saved here will persist locally via localStorage. They update all site sections instantly.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-medium focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={profileForm.title}
                    onChange={e => setProfileForm({ ...profileForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-medium focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={profileForm.location}
                  onChange={e => setProfileForm({ ...profileForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-medium focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Link
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-medium focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-medium focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Biography (About Section)
                </label>
                <textarea
                  rows={4}
                  value={profileForm.aboutText}
                  onChange={e => setProfileForm({ ...profileForm, aboutText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-normal focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Pro tip: Mention "we and I work alone" to highlight flexible structure and consultancies.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Consultation Fee ($)
                  </label>
                  <input
                    type="number"
                    value={profileForm.consultationRate}
                    onChange={e => setProfileForm({ ...profileForm, consultationRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Specified as $10 consult</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Consult Subtext
                  </label>
                  <input
                    type="text"
                    value={profileForm.consultationSub}
                    onChange={e => setProfileForm({ ...profileForm, consultationSub: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs font-normal focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Images (Unsplash/Web Link)
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-400 font-mono">
                      Bg Hero
                    </span>
                    <input
                      type="text"
                      placeholder="Background image URL..."
                      value={profileForm.heroImage}
                      onChange={e => setProfileForm({ ...profileForm, heroImage: e.target.value })}
                      className="w-full pl-20 pr-3 py-2 border border-slate-200 rounded-md text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-400 font-mono">
                        Avatar
                      </span>
                      <input
                        type="text"
                        placeholder="Profile avatar image URL or asset name..."
                        value={profileForm.profileImage}
                        onChange={e => setProfileForm({ ...profileForm, profileImage: e.target.value })}
                        className="w-full pl-20 pr-3 py-2 border border-slate-200 rounded-md text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-hidden text-slate-850"
                      />
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-slate-500 space-y-1">
                      <p className="font-bold text-slate-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-sky-500" /> How to publish your picture:
                      </p>
                      <ul className="list-disc pl-3.5 space-y-0.5 text-slate-600">
                        <li><strong>Paste Any Online Web Link:</strong> Host your photo on free platforms like <a href="https://postimages.org" target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">postimages.org</a> or Imgur, copy the direct image link (ending in <code>.jpg</code>/<code>.png</code>), and paste it above!</li>
                        <li><strong>Use Local Project Asset:</strong> You can upload your photo file inside your workspace's <code>/src/assets/images/</code> folder and type its name above.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onReset}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-md border border-transparent hover:border-red-100 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Revert Defaults
                </button>
                <button
                  type="submit"
                  disabled={profileSuccess}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer transition-colors shadow-xs"
                >
                  {profileSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-lime-400" /> Saved Successfully!
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Commit Brand Details
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* PORTFOLIO TAB */}
          {activeTab === "portfolio" && (
            <div className="space-y-6">
              
              {/* Add New Item */}
              <form onSubmit={handleAddItem} className="p-4 bg-slate-55 border border-slate-200 rounded-xl space-y-4 shadow-xs">
                <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5 justify-between">
                  <span className="flex items-center gap-1"><Plus className="w-4 h-4 text-sky-500" /> Catalog New Sample Item</span>
                  <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-full font-mono uppercase">Interactive Form</span>
                </h3>

                {/* Instant Blueprint Selector */}
                <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-pulse" /> Seeding Blueprint Builder
                    </span>
                    <span className="text-[9px] text-sky-600 bg-sky-50 font-bold px-2 py-0.5 rounded-md font-mono">
                      1-Click Autocomplete
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Select a curated premium designer formula below to instantly populate beautiful Figma, Webflow, and App Case Studies!
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {catalogBlueprints.map((bp, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setNewItemTitle(bp.title);
                          setNewItemCategory(bp.category);
                          setNewItemStyle(bp.style);
                          setNewItemTags(bp.tags);
                          setNewItemUrl(bp.imageUrl);
                          setNewItemDesc(bp.desc);
                          setNewItemClient(bp.client);
                          setNewItemYear(bp.year);
                          setNewItemFigmaLink(bp.figmaLink);
                          setNewItemLiveUrl(bp.liveUrl);
                          setNewItemLongDesc(bp.longDesc);
                        }}
                        className="p-2 bg-slate-50 border border-slate-100/85 hover:border-sky-300 hover:bg-sky-50/50 rounded-lg text-left transition-all text-xs font-semibold text-slate-700 hover:text-sky-950 flex items-center gap-1.5 cursor-pointer leading-snug w-full truncate"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">{bp.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Project Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nexus Packaging Identity"
                    value={newItemTitle}
                    onChange={e => setNewItemTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-sky-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Scope Category</label>
                    <select
                      value={newItemCategory}
                      onChange={e => setNewItemCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden bg-white"
                    >
                      <option value="Branding (Figma)">Branding (Figma)</option>
                      <option value="App Design">App Design</option>
                      <option value="App Screenshots">App Screenshots</option>
                      <option value="Webflow Web Design">Webflow Web Design</option>
                      <option value="Logo Design">Logo Design</option>
                      <option value="Packaging Design">Packaging Design</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Aesthetic Style</label>
                    <select
                      value={newItemStyle}
                      onChange={e => setNewItemStyle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden bg-white"
                    >
                      <option value="Technical & Clean">Technical & Clean</option>
                      <option value="Minimalist & Elegant">Minimalist & Elegant</option>
                      <option value="Warm & Organic">Warm & Organic</option>
                      <option value="Bold & Modern">Bold & Modern</option>
                      <option value="Classic & Bookish">Classic & Bookish</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Client</label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Global"
                      value={newItemClient}
                      onChange={e => setNewItemClient(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026"
                      value={newItemYear}
                      onChange={e => setNewItemYear(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Vector, Fineline, Kraft Paper, Tech"
                    value={newItemTags}
                    onChange={e => setNewItemTags(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Image Source (Direct Link URL)</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={newItemUrl}
                    onChange={e => setNewItemUrl(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-hidden bg-white"
                  />
                  
                  {/* Presets */}
                  <div className="mt-2">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Preset Design Mockup Images:</span>
                    <div className="flex flex-wrap gap-1">
                      {imagePresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewItemUrl(preset.url)}
                          className={`text-[10px] px-2 py-1 rounded transition-colors border ${
                            newItemUrl === preset.url 
                              ? "bg-slate-900 text-white border-slate-900" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Figma Share Link (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. https://figma.com/..."
                      value={newItemFigmaLink}
                      onChange={e => setNewItemFigmaLink(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Live Demo / Webflow link (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. https://site.webflow.io"
                      value={newItemLiveUrl}
                      onChange={e => setNewItemLiveUrl(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Brief Overview Description</label>
                  <input
                    type="text"
                    required
                    placeholder="Describe the styling choice and direct brand outcome in 1-2 lines..."
                    value={newItemDesc}
                    onChange={e => setNewItemDesc(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Case Study Detailed Summary (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Provide full strategic insights, grid setups, responsive details, or design token breakdowns used for the project presentation case study..."
                    value={newItemLongDesc}
                    onChange={e => setNewItemLongDesc(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden bg-white/50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-md transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Item to Live Catalog
                </button>
              </form>

              {/* Current List block */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Existing Catalog ({portfolioItems.length} items)
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden bg-white">
                  {portfolioItems.map(item => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={item.imageUrl} 
                          alt="" 
                          className="w-10 h-10 object-cover rounded bg-slate-100 border border-slate-200 shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-500 font-mono italic">
                            {item.category} • {item.style}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete "${item.title}"? This cannot be undone.`)) {
                            onDeletePortfolioItem(item.id);
                          }
                        }}
                        className="p-1 px-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* SERVICES TAB */}
          {activeTab === "services" && (
            <div className="space-y-5">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-xs text-amber-800 flex gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Rates & Packages</p>
                  <p>Describe each service's pricing model. The consultation rate itself is edited in the "Profile Info" tab ($10 rate).</p>
                </div>
              </div>

              {services.map((srv, idx) => (
                <ServiceItemForm
                  key={srv.id}
                  service={srv}
                  idx={idx}
                  onUpdateService={onUpdateService}
                />
              ))}
            </div>
          )}

          {/* BOOKINGS TAB */}
          {activeTab === "bookings" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 text-xs text-sky-800 flex gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600" />
                <div>
                  <p className="font-semibold mb-0.5 text-sky-900">Strategy Consultation Bookings</p>
                  <p className="text-sky-700 leading-relaxed">
                    Below is the live registry of strategy session requests submitted by prospective clients. All entries are captured and protected in Cloud Firestore securely.
                  </p>
                </div>
              </div>

              {loadingBookings ? (
                <div className="text-center py-8 text-xs font-mono text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                  Fetching lead rosters...
                </div>
              ) : bookingsList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white p-6">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-display font-medium text-slate-500">No bookings received yet</p>
                  <p className="text-[10px] text-slate-400 mt-1">When clients book strategy sessions on your homepage, they will show up here instantly.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookingsList.map((book) => (
                    <div key={book.id} className="p-4 border border-slate-200 rounded-xl bg-white space-y-3 shadow-xs relative hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-display font-black text-sm text-slate-900">
                            {book.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                            Received {book.createdAt ? new Date(book.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteBooking(book.id)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-colors cursor-pointer"
                          title="Delete request"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                        <div className="space-y-0.5">
                          <span className="block text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">CHOSEN DATE</span>
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> {book.date}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="block text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">START TIME (GMT+1)</span>
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {book.time}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 bg-sky-50/20 p-2.5 rounded-lg border border-sky-100/20">
                        <span className="block text-[9px] font-bold font-mono text-slate-500 uppercase tracking-wider">CLIENT EMAIL</span>
                        <a 
                          href={`mailto:${book.email}?subject=Daodu Strategy Consultation Booking&body=Hi ${book.name},%0D%0A%0D%0AThank you for reaching out for a strategy session on custom layouts and product assets. Let's align on a workflow soon.`}
                          className="text-xs font-semibold text-sky-600 hover:text-sky-800 underline flex items-center gap-1.5"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" /> {book.email}
                        </a>
                      </div>

                      {book.message && (
                        <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px]">
                          <span className="block text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1">PROJECT BACKGROUND / CHALLENGE</span>
                          <p className="bg-slate-50/50 p-2.5 rounded-md font-mono text-[10px] text-slate-600 whitespace-pre-wrap leading-relaxed">
                            {book.message}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer info line */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
          Built for Goodness Daodu • Save changes dynamically
        </div>
      </div>
    </div>
  );
}
