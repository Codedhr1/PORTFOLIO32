import React, { useState } from "react";
import { PortfolioItem, ProfileData, ServiceItem } from "../types";
import { 
  X, Save, Trash2, Plus, RefreshCw, Edit, Sparkles, Image, Check, Info, LogOut
} from "lucide-react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

interface CmsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileData;
  onUpdateProfile: (data: ProfileData) => void;
  portfolioItems: PortfolioItem[];
  onAddPortfolioItem: (item: PortfolioItem) => void;
  onDeletePortfolioItem: (id: string) => void;
  onUpdatePortfolioItem: (item: PortfolioItem) => void;
  services: ServiceItem[];
  onUpdateService: (service: ServiceItem) => void;
  onReset: () => void;
}

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
  const [activeTab, setActiveTab] = useState<"profile" | "portfolio" | "services">("profile");

  // Local state for profile edits
  const [profileForm, setProfileForm] = useState<ProfileData>({ ...profileData });
  const [profileSuccess, setProfileSuccess] = useState(false);

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

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 2500);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

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

    onAddPortfolioItem(newItem);

    // Reset fields
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
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
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
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-400 font-mono">
                      Avatar
                    </span>
                    <input
                      type="text"
                      placeholder="Profile avatar scale..."
                      value={profileForm.profileImage}
                      onChange={e => setProfileForm({ ...profileForm, profileImage: e.target.value })}
                      className="w-full pl-20 pr-3 py-2 border border-slate-200 rounded-md text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                    />
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
              <form onSubmit={handleAddItem} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1">
                  <Plus className="w-4 h-4 text-sky-500" /> Catalog New Sample Item
                </h3>

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
                <div key={srv.id} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white">
                  <div className="flex justify-between items-center">
                    <span className="font-display font-medium text-xs font-mono uppercase text-slate-400">
                      Service Package {idx + 1}
                    </span>
                    <input 
                      type="text"
                      value={srv.price}
                      onChange={(e) => onUpdateService({ ...srv, price: e.target.value })}
                      className="text-right font-display font-bold text-xs bg-slate-100 px-2 py-1 rounded text-slate-900 focus:outline-hidden"
                      placeholder="e.g. $100+"
                    />
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={srv.title}
                      onChange={(e) => onUpdateService({ ...srv, title: e.target.value })}
                      className="w-full font-display font-semibold text-sm text-slate-900 border-b border-dashed border-slate-200 focus:border-slate-400 focus:outline-hidden"
                      placeholder="Service Title"
                    />
                    <textarea
                      rows={2}
                      value={srv.description}
                      onChange={(e) => onUpdateService({ ...srv, description: e.target.value })}
                      className="w-full text-xs text-slate-600 focus:outline-hidden"
                      placeholder="Package Details"
                    />
                  </div>
                </div>
              ))}
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
