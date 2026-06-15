import React, { useState, useEffect } from "react";
import { PortfolioItem, ProfileData, ServiceItem } from "./types";
import { 
  DEFAULT_PROFILE, 
  DEFAULT_PORTFOLIO, 
  DEFAULT_SERVICES,
  CATEGORIES,
  STYLE_FILTERS
} from "./data";
import CmsPanel from "./components/CmsPanel";
import { 
  Mail, 
  Phone, 
  MapPin, 
  SlidersHorizontal, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  PenTool, 
  Package, 
  HelpCircle, 
  Settings, 
  CheckCircle2, 
  Globe, 
  Eye, 
  ExternalLink,
  Lock,
  MessageSquare,
  Bookmark,
  Plus
} from "lucide-react";
import { 
  db, 
  auth, 
  googleProvider, 
  OperationType, 
  handleFirestoreError,
  ADMIN_EMAIL
} from "./firebase";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, onSnapshot, setDoc, deleteDoc, collection } from "firebase/firestore";

export default function App() {
  // --- STATES & PERSISTENCE ---
  const [profile, setProfile] = useState<ProfileData>(() => {
    const cached = localStorage.getItem("daodu_profile");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.consultationRate === 100 || parsed.consultationRate === "100") parsed.consultationRate = 10;
        if (parsed.phone === "+23408148778176") parsed.phone = "+2348148778176";
        return parsed;
      } catch {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    const cached = localStorage.getItem("daodu_portfolio");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return DEFAULT_PORTFOLIO;
      }
    }
    return DEFAULT_PORTFOLIO;
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const cached = localStorage.getItem("daodu_services");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return DEFAULT_SERVICES;
      }
    }
    return DEFAULT_SERVICES;
  });

  const [cmsOpen, setCmsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem("daodu_is_admin") === "true";
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Authenticate & Subscribe dynamic streams
  useEffect(() => {
    // 1. Auth Status observer
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
        sessionStorage.setItem("daodu_is_admin", "true");
      } else {
        const hasLocalAdmin = sessionStorage.getItem("daodu_is_admin") === "true";
        if (!hasLocalAdmin) {
          setIsAdmin(false);
        }
      }
    });

    // 2. Profile Sync
    const profileRef = doc(db, "profiles", "daodu");
    const unsubscribeProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ProfileData;
        setProfile(data);
        localStorage.setItem("daodu_profile", JSON.stringify(data));
      } else {
        const userEmail = auth.currentUser?.email;
        const isLocAdmin = sessionStorage.getItem("daodu_is_admin") === "true";
        if (userEmail === ADMIN_EMAIL || isLocAdmin) {
          setDoc(profileRef, profile).catch(e => {
            console.warn("Seeding initial profile doc:", e);
          });
        }
      }
    }, (error) => {
      console.warn("Firestore profiles stream custom error: ", error.message);
    });

    // 3. Portfolio Sync
    const portfolioCol = collection(db, "portfolio");
    const unsubscribePortfolio = onSnapshot(portfolioCol, (snap) => {
      if (!snap.empty) {
        const items: PortfolioItem[] = [];
        snap.forEach((doc) => {
          items.push(doc.data() as PortfolioItem);
        });
        const sorted = items.sort((a, b) => {
          const aIndex = DEFAULT_PORTFOLIO.findIndex(d => d.id === a.id);
          const bIndex = DEFAULT_PORTFOLIO.findIndex(d => d.id === b.id);
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          return b.id.localeCompare(a.id);
        });
        setPortfolio(sorted);
        localStorage.setItem("daodu_portfolio", JSON.stringify(sorted));
      } else {
        const userEmail = auth.currentUser?.email;
        const isLocAdmin = sessionStorage.getItem("daodu_is_admin") === "true";
        if (userEmail === ADMIN_EMAIL || isLocAdmin) {
          portfolio.forEach((item) => {
            setDoc(doc(db, "portfolio", item.id), item).catch(e => {
              console.warn("Seeding portfolio item:", item.id, e);
            });
          });
        }
      }
    }, (error) => {
      console.warn("Firestore portfolio stream custom error: ", error.message);
    });

    // 4. Services Sync
    const servicesCol = collection(db, "services");
    const unsubscribeServices = onSnapshot(servicesCol, (snap) => {
      if (!snap.empty) {
        const items: ServiceItem[] = [];
        snap.forEach((doc) => {
          items.push(doc.data() as ServiceItem);
        });
        const sorted = items.sort((a, b) => {
          const aIndex = DEFAULT_SERVICES.findIndex(d => d.id === a.id);
          const bIndex = DEFAULT_SERVICES.findIndex(d => d.id === b.id);
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          return a.id.localeCompare(b.id);
        });
        setServices(sorted);
        localStorage.setItem("daodu_services", JSON.stringify(sorted));
      } else {
        const userEmail = auth.currentUser?.email;
        const isLocAdmin = sessionStorage.getItem("daodu_is_admin") === "true";
        if (userEmail === ADMIN_EMAIL || isLocAdmin) {
          services.forEach((srv) => {
            setDoc(doc(db, "services", srv.id), srv).catch(e => {
              console.warn("Seeding service item:", srv.id, e);
            });
          });
        }
      }
    }, (error) => {
      console.warn("Firestore services stream custom error: ", error.message);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
      unsubscribePortfolio();
      unsubscribeServices();
    };
  }, []);

  // Save helpers
  const updateProfile = async (newProfile: ProfileData) => {
    setProfile(newProfile);
    localStorage.setItem("daodu_profile", JSON.stringify(newProfile));
    try {
      await setDoc(doc(db, "profiles", "daodu"), newProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "profiles/daodu");
    }
  };

  const addPortfolioItem = async (newItem: PortfolioItem) => {
    const updated = [newItem, ...portfolio];
    setPortfolio(updated);
    localStorage.setItem("daodu_portfolio", JSON.stringify(updated));
    try {
      await setDoc(doc(db, "portfolio", newItem.id), newItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `portfolio/${newItem.id}`);
    }
  };

  const deletePortfolioItem = async (id: string) => {
    const updated = portfolio.filter(item => item.id !== id);
    setPortfolio(updated);
    localStorage.setItem("daodu_portfolio", JSON.stringify(updated));
    try {
      await deleteDoc(doc(db, "portfolio", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `portfolio/${id}`);
    }
  };

  const updatePortfolioItem = async (updatedItem: PortfolioItem) => {
    const updated = portfolio.map(item => item.id === updatedItem.id ? updatedItem : item);
    setPortfolio(updated);
    localStorage.setItem("daodu_portfolio", JSON.stringify(updated));
    try {
      await setDoc(doc(db, "portfolio", updatedItem.id), updatedItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `portfolio/${updatedItem.id}`);
    }
  };

  const updateServiceValue = async (updatedSrv: ServiceItem) => {
    const updated = services.map(srv => srv.id === updatedSrv.id ? updatedSrv : srv);
    setServices(updated);
    localStorage.setItem("daodu_services", JSON.stringify(updated));
    try {
      await setDoc(doc(db, "services", updatedSrv.id), updatedSrv);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `services/${updatedSrv.id}`);
    }
  };

  const resetAllData = async () => {
    if (window.confirm("Restore default professional templates? Your custom changes will be reset.")) {
      setProfile(DEFAULT_PROFILE);
      setPortfolio(DEFAULT_PORTFOLIO);
      setServices(DEFAULT_SERVICES);
      localStorage.removeItem("daodu_profile");
      localStorage.removeItem("daodu_portfolio");
      localStorage.removeItem("daodu_services");

      const isGoogleAdmin = auth.currentUser?.email === ADMIN_EMAIL;
      const isLocalAdmin = sessionStorage.getItem("daodu_is_admin") === "true";

      if (isGoogleAdmin || isLocalAdmin) {
        try {
          await setDoc(doc(db, "profiles", "daodu"), DEFAULT_PROFILE);
          for (const item of portfolio) {
            await deleteDoc(doc(db, "portfolio", item.id));
          }
          for (const item of DEFAULT_PORTFOLIO) {
            await setDoc(doc(db, "portfolio", item.id), item);
          }
          for (const srv of services) {
            await deleteDoc(doc(db, "services", srv.id));
          }
          for (const srv of DEFAULT_SERVICES) {
            await setDoc(doc(db, "services", srv.id), srv);
          }
          alert("Successfully restored defaults globally on cloud database instances!");
        } catch (error) {
          console.error("Cloud database reset error: ", error);
          alert("Restored locally. Cloud database update failed.");
        }
      } else {
        alert("Restored locally. Admin Google authorization required to reset cloud instances.");
      }
    }
  };

  const handleOpenCms = () => {
    if (isAdmin) {
      setCmsOpen(true);
    } else {
      setShowPasswordModal(true);
      setPasswordInput("");
      setPasswordError("");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "0Ctobers@18") {
      try {
        // Authenticate standard user with Email & Password in Firebase Firestore
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, passwordInput);
        setIsAdmin(true);
        sessionStorage.setItem("daodu_is_admin", "true");
        setShowPasswordModal(false);
        setCmsOpen(true);
        alert("Authenticated with administrative privileges!");
      } catch (err: any) {
        // If they are not found or disabled, let's try to self-register them in their Firebase project!
        if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
          try {
            await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, passwordInput);
            setIsAdmin(true);
            sessionStorage.setItem("daodu_is_admin", "true");
            setShowPasswordModal(false);
            setCmsOpen(true);
            alert("Admin account registered and logged in successfully!");
          } catch (regErr: any) {
            console.error("Auto-registration of admin account failed:", regErr);
            // Fallback: logged in locally, but warn about cloud writes
            setIsAdmin(true);
            sessionStorage.setItem("daodu_is_admin", "true");
            setShowPasswordModal(false);
            setCmsOpen(true);
            alert(`Local Admin Session Opened. Note: Firebase email/password registration failed (${regErr.message || regErr}). Please ensure you open this app in a New Tab and use Google Sign-In to sync permanently to the Cloud database.`);
          }
        } else if (err.code === "auth/operation-not-allowed") {
          // If Email/password provider is not enabled in Firebase project consoles, bypass but warn
          setIsAdmin(true);
          sessionStorage.setItem("daodu_is_admin", "true");
          setShowPasswordModal(false);
          setCmsOpen(true);
          alert("Local Admin Session Opened. Note: Email/Password provider is disabled in your Firebase Auth console. Please open this app in a New Tab and use 'Sign in with Google' to sync permanently to the Cloud database.");
        } else {
          setPasswordError("Authentication Error: " + (err.message || err));
        }
      }
    } else {
      setPasswordError("Incorrect Access Key");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
        sessionStorage.setItem("daodu_is_admin", "true");
        setShowPasswordModal(false);
        setCmsOpen(true);
        alert(`Authenticated administrator: ${user.email}`);
      } else {
        await signOut(auth);
        alert(`Unauthorized login: Only Daodu's official admin account (${ADMIN_EMAIL}) is permitted to modify the database.`);
      }
    } catch (err: any) {
      console.error("Google Auth error: ", err);
      setPasswordError("Authentication Failed: " + (err.message || err));
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOut(auth);
      setIsAdmin(false);
      sessionStorage.removeItem("daodu_is_admin");
      setCmsOpen(false);
      alert("Admin successfully logged out of Cloud session.");
    } catch (err: any) {
      console.error("Google Sign Out failed: ", err);
    }
  };

  // --- FILTER & PORTFOLIO LOGIC ---
  const [selectedCategory, setSelectedCategory] = useState("All Scope");
  const [selectedStyle, setSelectedStyle] = useState("All Styles");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCollection = portfolio.filter(item => {
    const matchCat = selectedCategory === "All Scope" || item.category === selectedCategory;
    const matchStyle = selectedStyle === "All Styles" || item.style === selectedStyle;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchStyle && matchSearch;
  });

  // --- DETAILED VIEW MODAL ---
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);

  // --- CONSULTATION FORM STATE ---
  const [bookingDate, setBookingDate] = useState("2026-06-15");
  const [bookingTime, setBookingTime] = useState("10:00");
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingName || !bookingEmail) {
      alert("Please provide a name and email to proceed.");
      return;
    }
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setBookingName("");
      setBookingEmail("");
      setBookingMessage("");
    }, 4500);
  };

  // Quick helper to choose icons dynamically
  const IconComponent = ({ name, className }: { name: string; className?: string }) => {
    const styleClass = className || "w-5 h-5";
    switch (name) {
      case "Sparkles": return <Sparkles className={styleClass} />;
      case "PenTool": return <PenTool className={styleClass} />;
      case "Package": return <Package className={styleClass} />;
      default: return <HelpCircle className={styleClass} />;
    }
  };

  // --- LIGHTNING FAST IMAGE PROGRESSIVE LOADING CHIPS ---
  const ProgressiveImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
    const [loaded, setLoaded] = useState(false);
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      setImgSrc(src);
      setLoaded(false);
      setHasError(false);
    }, [src]);

    // Simple hash of alt text to create a uniquely tailored design system gradient
    const getTailoredGradient = (text: string) => {
      let hash = 0;
      const cleanText = text || "design";
      for (let i = 0; i < cleanText.length; i++) {
        hash = cleanText.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % 5;
      const combos = [
        { grad: "from-slate-900 via-indigo-950 to-slate-900", accent: "text-indigo-400 border-indigo-500/30 bg-indigo-500/5" },
        { grad: "from-slate-950 via-cyan-950 to-slate-900", accent: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5" },
        { grad: "from-slate-900 via-violet-950 to-neutral-900", accent: "text-violet-400 border-violet-500/30 bg-violet-500/5" },
        { grad: "from-slate-950 via-slate-900 to-emerald-950", accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" },
        { grad: "from-neutral-950 via-zinc-900 to-neutral-900", accent: "text-amber-400 border-amber-500/30 bg-amber-500/5" }
      ];
      return combos[index];
    };

    const config = getTailoredGradient(alt);
    const initials = alt
      ? alt.split(" ").map(w => w[0]).filter(c => /[A-Za-z]/.test(c)).slice(0, 3).join("").toUpperCase()
      : "DS";

    if (hasError || !imgSrc) {
      return (
        <div className={`w-full h-full bg-gradient-to-br ${config.grad} relative flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden ${className}`}>
          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className={`relative px-4 py-3 rounded-xl border backdrop-blur-md ${config.accent} flex flex-col items-center gap-1 max-w-[85%] shadow-lg`}>
            <span className="text-xl font-extrabold font-display tracking-widest leading-none">
              {initials}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-mono opacity-80 whitespace-nowrap">
              Premium Canvas
            </span>
          </div>

          <span className="absolute bottom-3 left-3 right-3 text-[8px] uppercase tracking-widest font-mono text-slate-400 opacity-60 line-clamp-1">
            {alt || "Figma Workspace Asset"}
          </span>
        </div>
      );
    }

    return (
      <div className="relative overflow-hidden w-full h-full bg-slate-50">
        {!loaded && (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center animate-pulse">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Loading...</span>
          </div>
        )}
        <img
          src={imgSrc}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setHasError(true);
          }}
          className={`${className} transition-all duration-500 ease-out ${
            loaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-md"
          }`}
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white" id="main-frame">
      
      {/* PERSISTENT HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100/80" id="global-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand Logo */}
          <a href="#hero" onClick={() => setSelectedProject(null)} className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center font-display font-black text-lg tracking-wider group-hover:scale-105 transition-transform">
              GD
            </div>
            <div>
              <span className="font-display font-extrabold text-base tracking-tight text-slate-900 block leading-none">
                {profile.name}
              </span>
              <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 block mt-1">
                {profile.title}
              </span>
            </div>
          </a>

          {/* Quick navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#about" onClick={() => setSelectedProject(null)} className="hover:text-slate-950 transition-colors cursor-pointer">About & Focus</a>
            <a href="#portfolio" onClick={() => setSelectedProject(null)} className="hover:text-slate-950 transition-colors cursor-pointer">Selected Projects</a>
            <a href="#services" onClick={() => setSelectedProject(null)} className="hover:text-slate-950 transition-colors cursor-pointer">Services</a>
            <a href="#consultation" onClick={() => setSelectedProject(null)} className="hover:text-slate-950 transition-colors flex items-center gap-1 text-sky-600 bg-sky-50 px-2.5 py-1 rounded-sm border border-sky-100/50 cursor-pointer">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              Secure Consultation
            </a>
          </nav>

          {/* CMS Admin Workspace Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCms}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold font-mono tracking-wider uppercase text-slate-900 hover:text-white bg-amber-300 hover:bg-slate-900 border border-slate-900/10 hover:border-slate-900 rounded-lg cursor-pointer transition-all duration-200"
              title="Configure Profile & Catalog"
              id="header-cms-btn"
            >
              <Settings className="w-3.5 h-3.5 animate-spin-slow" />
              <span>CMS Workspace</span>
            </button>
          </div>

        </div>
      </header>

      {!selectedProject ? (
        <>
          {/* HERO SECTION - MOTIONSITE.AI STYLE (PROMINENT RIGHT PICTURE, BRIGHT LAYOUT) */}
          <section className="relative overflow-hidden bg-white py-12 md:py-20 lg:py-24 border-b border-slate-100" id="hero">
        
        {/* Subtle grid elements representing designer canvas */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* HERO TEXT: LEFT (7 columns) */}
            <div className="lg:col-span-7 space-y-7 pr-0 lg:pr-6 text-left">

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.08] tracking-tight text-slate-900">
                Designing in Figma. <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-indigo-600 to-slate-900">
                  Developing in Webflow.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
                Hi, I'm <strong className="text-slate-900 font-semibold">{profile.name}</strong>, a premium <strong className="text-slate-900 font-semibold">{profile.title}</strong> based in Lagos, Nigeria. I craft world-class, high-fidelity Figma design systems and build flawless, high-performance Webflow websites that solidify your digital presence.
              </p>

              {/* Fast Bio / Callouts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Location</span>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> {profile.location}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Contact Line</span>
                  <span className="text-xs font-bold text-slate-900 truncate block">
                    {profile.email}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Phone Call</span>
                  <span className="text-xs font-bold text-slate-900 block font-mono">
                    {profile.phone}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <a 
                  href="#portfolio" 
                  className="px-6 py-3.5 text-xs font-bold hover:font-extrabold tracking-wider uppercase text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 group"
                >
                  <span>Explore Portfolio Grid</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>

                <a 
                  href="#consultation" 
                  className="px-6 py-3.5 text-xs font-bold tracking-wider uppercase text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-sky-500" />
                  <span>Secure Consultation</span>
                </a>
              </div>

            </div>

            {/* HERO PIC: RIGHT (5 columns) - BRIGHT & CONTRASTING BRAND WORKFRAME */}
            <div className="lg:col-span-5 relative" id="hero-showcase-pic">
              <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none">
                
                {/* Visual Frame */}
                <div className="absolute inset-0 bg-blue-100 rounded-2xl transform rotate-3 scale-102 opacity-50 blur-xs transition-transform hover:rotate-2 duration-300" />
                
                {/* Primary High-Resolution Picture container */}
                <div className="relative rounded-2xl overflow-hidden aspect-square sm:aspect-13/10 lg:aspect-square bg-slate-100 border-4 border-white shadow-xl">
                  <ProgressiveImage 
                    src={profile.heroImage} 
                    alt="Creative Studio Showcase" 
                    className="w-full h-full object-cover" 
                  />
                  
                  {/* Floating floating card indicating Lagos office */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3.5 rounded-xl border border-white/40 shadow-lg flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={profile.profileImage}
                        alt="Goodness Daodu Avatar" 
                        className="w-9 h-9 rounded-full object-cover border border-white shrink-0 bg-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="font-display font-extrabold text-xs text-slate-900 block leading-none">
                          {profile.name}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 block leading-none mt-1">
                          Solo Designer & Developer
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-600 text-white font-mono text-[9px] font-bold rounded-md uppercase tracking-wider">
                      ● Active Now
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ABOUT SECTION - SPECIFYING "WE AND I WORK ALONE" & CONSULTATIONS */}
      <section className="py-16 md:py-24 bg-slate-50 text-slate-800" id="about">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-10">
          
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-600 block">
              Core Creative Philosophy
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-slate-900">
              The Power of Solo Execution
            </h2>
          </div>

          <div className="relative bg-white p-8 sm:p-12 rounded-2xl border border-slate-100 shadow-sm leading-relaxed text-slate-600 text-base space-y-6">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center font-serif text-lg italic shadow-xs">
              “
            </div>
            
            <p className="text-slate-700 italic font-medium text-lg leading-relaxed">
              "{profile.aboutText}"
            </p>

            <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 font-display">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  Direct Alignment
                </h4>
                <p className="text-xs text-slate-500">
                  You interact directly with me on every prototype, layout decision, and animation. No agency hand-offs, no lost translations.
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 font-display">
                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 animate-pulse" />
                  Accelerated Speed
                </h4>
                <p className="text-xs text-slate-500">
                  Highly efficient design-to-code sprint executions. Figma components translate seamlessly into production-ready Webflow containers instantly.
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 font-display">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 animate-pulse" />
                  Pristine Quality
                </h4>
                <p className="text-xs text-slate-500">
                  Total client accountability from start to finish. I build clean, ultra-responsive code frameworks tailored strictly to modern SEO standards.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* PORTFOLIO GRID: FILTER SYSTEM & LIGHTNING-FAST SAMPLES */}
      <section className="py-20 bg-white border-t border-b border-slate-100" id="portfolio">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
            
            <div className="text-left space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-600 block">
                Selected Work Catalogue
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-slate-900">
                Pristine Aesthetics & Deliverables
              </h2>
              <p className="text-sm text-slate-500 max-w-lg">
                Browse through my hand-crafted samples. Filter by specific layout scope or aesthetic styles to match your creative aspiration.
              </p>
            </div>

            {/* CMS ADD SHORTCUT */}
            <button
              onClick={handleOpenCms}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Catalog New Item</span>
            </button>

          </div>

          {/* ADVANCED FILTER SYSTEM */}
          <div className="space-y-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl mb-8" id="filters-workspace">
            
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 capitalize font-mono mb-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-700" />
              <span>Filter Controls</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Category selector */}
              <div className="lg:col-span-7 space-y-1.5 text-left">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">1. Design Category</span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-3.5 py-1.5 rounded-lg border font-medium cursor-pointer transition-all ${
                        selectedCategory === cat
                          ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aesthetic Style Selector */}
              <div className="lg:col-span-5 space-y-1.5 text-left">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">2. Aesthetic Theme</span>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_FILTERS.map(style => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={`text-xs px-3.5 py-1.5 rounded-lg border font-medium cursor-pointer transition-all ${
                        selectedStyle === style
                          ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Quick search input */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <span className="text-xs text-slate-400 font-medium shrink-0">Search Keywords:</span>
              <input
                type="text"
                placeholder="Type tags e.g. 'Fintech', 'Packaging', 'Vector'..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full max-w-md px-3.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
              {(selectedCategory !== "All Scope" || selectedStyle !== "All Styles" || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory("All Scope");
                    setSelectedStyle("All Styles");
                    setSearchQuery("");
                  }}
                  className="text-xs text-red-500 hover:underline cursor-pointer"
                >
                  Clear Active Filters
                </button>
              )}
            </div>

          </div>

          {/* SAMPLES GALLERY GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="portfolio-gallery">
            {filteredCollection.length > 0 ? (
              filteredCollection.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedProject(item)}
                  className="group bg-slate-50 border border-slate-100/70 hover:border-slate-300 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg text-left flex flex-col"
                >
                  
                  {/* High Quality, Progressive-Loading image block */}
                  <div className="aspect-11/8 w-full bg-slate-200 overflow-hidden relative shrink-0">
                    <ProgressiveImage 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                    
                    {/* Dark gradient layover on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/0 to-slate-950/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white text-xs font-bold tracking-wider uppercase flex items-center gap-1 font-mono">
                        <Eye className="w-4 h-4 text-sky-400" />
                        Examine Craft
                      </span>
                    </div>

                    {/* Badge Category and style inline */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      <span className="bg-slate-900/90 text-white text-[9px] font-bold font-mono tracking-wider uppercase px-2 py-0.5 rounded-sm">
                        {item.category}
                      </span>
                      <span className="bg-white/95 text-slate-800 text-[9px] font-bold font-mono tracking-wider px-2 py-0.5 rounded-sm shadow-xs">
                        {item.style}
                      </span>
                    </div>
                  </div>

                  {/* Details Card section */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5 bg-white">
                    <div className="space-y-1.5">
                      <h3 className="font-display font-extrabold text-slate-950 text-base leading-snug group-hover:text-sky-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-1 pt-1 mb-1">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded-xs">
                          #{tag.toLowerCase()}
                        </span>
                      ))}
                    </div>

                    {/* Direct Premium Link Triggers */}
                    <div 
                      className="pt-3 border-t border-slate-100/80 flex items-center justify-between gap-1.5" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedProject(item)}
                        className="text-[11px] font-bold uppercase tracking-wider text-slate-900 hover:text-sky-600 transition-colors flex items-center gap-0.5 cursor-pointer"
                      >
                        Case Study →
                      </button>
                    </div>

                  </div>

                </div>
              ))
            ) : (
              <div className="col-span-full py-16 px-4 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <SlidersHorizontal className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="font-display font-bold text-slate-700">No projects found matching the active keys</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing active category or style selections, or use the CMS panel on top to catalog a clean sample.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("All Scope");
                    setSelectedStyle("All Styles");
                    setSearchQuery("");
                  }}
                  className="mt-2 text-xs font-bold text-sky-600 hover:underline"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* CORE SERVICES & PRICING PLANS */}
      <section className="py-20 bg-slate-50 text-slate-800 border-b border-slate-100" id="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-600 block">
              Core Design Services
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-slate-900">
              Pricing Packages & Production Models
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Transparent scaling structures aligned with business targets. Customize rates or update item specs anytime using the CMS panel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map(srv => (
              <div 
                key={srv.id} 
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs text-left hover:shadow-md transition-shadow relative flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  <div className="w-10 h-10 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center">
                    <IconComponent name={srv.iconName} className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-slate-900 leading-snug">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-50/80 flex items-baseline justify-between gap-2">
                  <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Starts From</span>
                  <span className="text-sm font-black text-slate-950 font-display bg-sky-50 px-2 py-0.5 rounded text-sky-700">
                    {srv.price}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* DETAILED INTERACTIVE CONSULTATION BOOKING BLOCK */}
      <section className="py-20 bg-white" id="consultation">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch rounded-3xl border border-slate-100 overflow-hidden shadow-xl bg-slate-50">
            
            {/* Call Left Details (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between space-y-8">
              
              <div className="space-y-4 text-left">
                <span className="p-1 px-2.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-mono tracking-wider block w-max uppercase font-bold">
                  Direct Strategy Sync
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
                  Reserve a Strategy Consultation
                </h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Skip the emails. Secure a direct 1-on-1 brainstorming session. We will review your product assets, Figma mapping wireframes, and design roadmap live.
                </p>
              </div>

              {/* Consultation Info Badge */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">Consultation Strategy Sessions:</span>
                  <span className="text-xs font-black text-emerald-400 font-display uppercase tracking-wider">Active</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-display text-white">Direct Design Sync</span>
                </div>
              </div>

              {/* Guarantees List */}
              <ul className="text-left space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>High-Fidelity Actionable Brand Sketch</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Interactive Scope Formulation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Lagos-time compatible slots</span>
                </li>
              </ul>

              {/* Footer email details */}
              <div className="text-left text-[10px] text-slate-500 font-mono">
                Questions? email goodnessdaodu940@gmail.com
              </div>

            </div>

            {/* Booking Form Interface Right (7 cols) */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-10 text-left flex flex-col justify-between">
              
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <h4 className="text-slate-900 font-display font-extrabold text-lg">
                  Submit Reservation Spot
                </h4>

                {bookingSuccess ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl text-center space-y-3 animate-fade-in/60">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <div>
                      <h4 className="font-display font-bold text-emerald-950 text-sm">Consultation Spot Placed!</h4>
                      <p className="text-xs text-emerald-700 mt-1 max-w-sm mx-auto">
                        Thank you! An invite and custom calendar link for {bookingDate} at {bookingTime} has been sent to your inbox.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Your Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. John Doe"
                          value={bookingName}
                          onChange={e => setBookingName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Your Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="business@company.co"
                          value={bookingEmail}
                          onChange={e => setBookingEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          <Calendar className="w-3 h-3 text-slate-400 inline mr-1" /> Choose Date
                        </label>
                        <input
                          type="date"
                          value={bookingDate}
                          onChange={e => setBookingDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          <Clock className="w-3 h-3 text-slate-400 inline mr-1" /> Start Time (GMT+1)
                        </label>
                        <input
                          type="time"
                          value={bookingTime}
                          onChange={e => setBookingTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Project Background / Challenge</label>
                      <textarea
                        rows={3}
                        placeholder="Detail briefly which logo styles, timeline thresholds, or competitor strategies you'd love to focus on..."
                        value={bookingMessage}
                        onChange={e => setBookingMessage(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                      />
                    </div>

                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" />
                      We respect your privacy. No spam or distribution. Get a direct roadmap assessment.
                    </p>

                    <button
                      type="submit"
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Secure Consultation Session
                    </button>
                  </>
                )}
              </form>

            </div>

          </div>

        </div>
      </section>
        </>
      ) : (
        /* --- DEDICATED INLINE PORTFOLIO DETAIL VIEW (NOT A POPUP) --- */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-10 animate-fade-in text-left animate-slide-up" id="project-detail-view">
          
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-5">
            <button
              onClick={() => {
                setSelectedProject(null);
                setTimeout(() => {
                  document.getElementById("portfolio")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-white bg-white hover:bg-slate-950 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Portfolio Catalog</span>
            </button>

            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
              Project Case Study
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Content Case (8 columns) */}
            <div className="lg:col-span-8 space-y-8">
              {/* High-definition media preview */}
              <div className="aspect-16/10 w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/50 shadow-md">
                <ProgressiveImage
                  src={selectedProject.imageUrl} 
                  alt={selectedProject.title} 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Specs Block */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-100 border border-slate-200/50 rounded-2xl">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-semibold">Client Brand</span>
                  <span className="font-bold text-slate-900 text-sm leading-tight block mt-0.5">{selectedProject.client}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-semibold">Delivery Year</span>
                  <span className="font-bold text-slate-900 text-sm leading-tight block mt-0.5">{selectedProject.year}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-semibold">Project Type</span>
                  <span className="font-bold text-slate-900 text-sm leading-tight block mt-0.5 line-clamp-1">{selectedProject.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-semibold">Visual Theme</span>
                  <span className="font-bold text-slate-900 text-xs leading-tight block mt-1 line-clamp-1 text-sky-600">{selectedProject.style}</span>
                </div>
              </div>

              {/* Primary Narrative */}
              <div className="space-y-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-100/70 shadow-xs text-left">
                <span className="text-xs uppercase font-mono tracking-widest text-indigo-600 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  The Creative Vision & Objective
                </span>
                <p className="text-lg font-medium text-slate-800 leading-relaxed font-display">
                  "{selectedProject.description}"
                </p>
              </div>

              {/* Detailed Process */}
              <div className="space-y-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-100/70 shadow-xs text-left">
                <h4 className="text-xs uppercase font-mono tracking-widest text-slate-450 font-bold">
                  Strategic Realization & Execution Approach
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line font-normal font-sans">
                  {selectedProject.longDescription || "This project represents a bespoke design-to-code setup mapped strictly to achieve high usability standards. Every layout block, form interaction, and responsiveness breakpoint was fully crafted in Figma before implementing hand-polished animations and clean Webflow collections."}
                </p>
              </div>
            </div>

            {/* Right Meta Sidebar Case (4 columns) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Tag Identifiers */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-3 text-left">
                <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                  Extracted Scope Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.tags.map((tag, idx) => (
                    <span key={idx} className="bg-slate-50 text-slate-600 text-[11px] border border-slate-200 px-3 py-1.5 rounded-lg font-mono">
                      #{tag.toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Consultation CTA Block */}
              <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-md border border-indigo-700/30 text-left space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-sky-200 block">
                    Direct Collaboration
                  </span>
                  <h4 className="font-display font-extrabold text-lg leading-tight">
                    Want to execute a similar scope?
                  </h4>
                  <p className="text-xs text-indigo-100 leading-normal">
                    Book a consultation with Goodness. Run through layout wireframes and custom asset workflows directly to map out your product catalog.
                  </p>
                </div>
                
                <a
                  href="#consultation"
                  onClick={() => setSelectedProject(null)}
                  className="inline-flex w-full items-center justify-center gap-1.5 px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider rounded-xl transition-all text-center cursor-pointer font-sans"
                >
                  <Calendar className="w-4 h-4 text-sky-500" />
                  <span>Secure Consultation</span>
                </a>
              </div>

            </div>

          </div>

        </main>
      )}

      {/* FOOTER AREA */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-850" id="global-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/5 text-center md:text-left">
            <div>
              <span className="font-display font-black text-xl tracking-wider uppercase">GD STUDIO</span>
              <p className="text-xs text-slate-400 mt-1">High-performance Visual Identity Systems • Lagos Office</p>
            </div>
            
            {/* Quick Contact Chips */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-md">
                <Mail className="w-3.5 h-3.5 text-sky-400" /> {profile.email}
              </span>
              <span className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-md">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> {profile.phone}
              </span>
              <span className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-md">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> Lagos, Nigeria
              </span>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-slate-400">
            <div>
              © 2026 {profile.name}. All Rights Reserved. Core brand values engineered with artistic craft.
            </div>
            
            {/* Quick reset button */}
            <button
              onClick={resetAllData}
              className="text-[10px] font-mono hover:text-white underline cursor-pointer"
            >
              Reset Local Database to Defaults
            </button>
          </div>
        </div>
      </footer>

      {/* --- FLOATING TRIGGER CALL FOR WORKSPACE --- */}
      <div className="fixed bottom-6 right-6 z-45" id="floating-workspace-trigger">
        <button
          onClick={handleOpenCms}
          className="p-4 rounded-full bg-slate-900 hover:bg-slate-800 hover:-translate-y-0.5 text-white active:scale-95 shadow-2xl flex items-center gap-2 group transition-all cursor-pointer border border-white/20"
          id="floating-cms-panel-btn"
        >
          <Settings className="w-5 h-5 animate-spin-slow" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 text-xs font-mono font-bold uppercase tracking-wider">
            Edit Portfolio (CMS)
          </span>
        </button>
      </div>

      {/* --- INTEGRATED CMS PANEL --- */}
      <CmsPanel
        isOpen={cmsOpen}
        onClose={() => setCmsOpen(false)}
        profileData={profile}
        onUpdateProfile={updateProfile}
        portfolioItems={portfolio}
        onAddPortfolioItem={addPortfolioItem}
        onDeletePortfolioItem={deletePortfolioItem}
        onUpdatePortfolioItem={updatePortfolioItem}
        services={services}
        onUpdateService={updateServiceValue}
        onReset={resetAllData}
      />

      {/* --- PASSWORD PROTECTION PROMPT OVERLAY --- */}
      {showPasswordModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setShowPasswordModal(false)}
          id="password-dialog-overlay"
        >
          <div 
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative border border-slate-100 space-y-6 animate-scale-up"
            onClick={e => e.stopPropagation()}
            id="password-dialog-container"
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-display font-black text-xl text-slate-900 tracking-tight">
                Admin Authentication
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The CMS Workspace is password protected. Authenticate with your Google account or enter the administrator credentials.
              </p>
            </div>

            <div className="space-y-5">
              {/* Google Sign-In option */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-xs hover:shadow-sm cursor-pointer transition-all"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Sign in with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-100 flex-1" />
                <span className="text-[9px] font-mono font-semibold text-slate-400 uppercase tracking-widest bg-white px-2">or use master key</span>
                <div className="h-px bg-slate-100 flex-1" />
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">
                    Enter Password
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="••••••••••••"
                    value={passwordInput}
                    onChange={e => {
                      setPasswordInput(e.target.value);
                      setPasswordError("");
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-xl text-sm transition-all text-center tracking-widest font-mono focus:outline-hidden"
                  />
                  {passwordError && (
                    <p className="text-[10px] text-red-500 font-mono font-bold mt-1 text-center">
                      ⚠ {passwordError}
                    </p>
                  )}
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer text-center"
                  >
                    Confirm
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
