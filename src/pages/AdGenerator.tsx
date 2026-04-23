import React, { useState } from "react";
import { motion } from "framer-motion";
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import {
  Sparkles, Image as ImageIcon, Download, Copy, RefreshCw,
  Megaphone, Tag, Users, MapPin, Star, Gift, Phone,
  Instagram, Facebook, Linkedin, MessageSquare, ChevronDown
} from "lucide-react";

const API_BASE = "http://localhost:8000";

const platforms = [
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
];

const tones = ["modern", "professional", "bold", "friendly", "luxury", "minimalist"];

const initialForm = {
  business_name: "",
  products: "",
  target_audience: "",
  location: "",
  usp: "",
  offer: "",
  contact: "",
  platform: "instagram",
  tone: "modern",
  visual_style: "modern product photography",
};

export default function AdGenerator() {
  const [form, setForm] = useState(initialForm);
  const [adCopy, setAdCopy] = useState<any>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [loadingCopy, setLoadingCopy] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"copy" | "image">("copy");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const generateCopy = async () => {
    if (!form.business_name || !form.products) {
      setError("Business name and products are required.");
      return;
    }
    setError("");
    setLoadingCopy(true);
    setAdCopy(null);
    try {
      const params = new URLSearchParams({
        business_name: form.business_name,
        products: form.products,
        target_audience: form.target_audience,
        location: form.location,
        usp: form.usp,
        offer: form.offer,
        contact: form.contact,
        platform: form.platform,
        tone: form.tone,
      });
      const res = await fetch(`${API_BASE}/api/ads/generate?${params}`, { method: "POST" });
      const data = await res.json();
      if (data.success) setAdCopy(data.data);
      else setError(data.detail || "Failed to generate ad copy.");
    } catch {
      setError("Could not connect to backend.");
    } finally {
      setLoadingCopy(false);
    }
  };

  const generateImage = async () => {
    if (!form.business_name || !form.products) {
      setError("Business name and products are required.");
      return;
    }
    setError("");
    setLoadingImage(true);
    setImageB64(null);
    try {
      const params = new URLSearchParams({
        business_name: form.business_name,
        products: form.products,
        visual_style: form.visual_style,
        platform: form.platform,
        tone: form.tone,
      });
      const res = await fetch(`${API_BASE}/api/ads/generate-image?${params}`, { method: "POST" });
      const data = await res.json();
      if (data.success) setImageB64(data.image_base64);
      else setError(data.detail || "Failed to generate image.");
    } catch {
      setError("Could not connect to backend.");
    } finally {
      setLoadingImage(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadImage = () => {
    if (!imageB64) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${imageB64}`;
    link.download = `${form.business_name.replace(/\s+/g, "_")}_ad.png`;
    link.click();
  };

  return (
    <AuthenticatedShell>
      <div className="min-h-full bg-background text-foreground font-sans rounded-xl overflow-hidden shadow-inner border border-border">
        {/* Header */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100 via-blue-50 to-emerald-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-emerald-900/20" />
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
                <Megaphone className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-purple-400 text-sm font-medium tracking-widest uppercase">AI-Powered</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Advertisement Generator
            </h1>
            <p className="mt-2 text-muted-foreground max-w-xl">
              Generate professional ad copy with <span className="text-purple-400">Groq AI</span> and stunning visuals with{" "}
              <span className="text-blue-400">Google Gemini</span>.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ── Left: Form ── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="bg-card border border-border rounded-2xl p-8 space-y-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-foreground">Campaign Details</h2>

            {/* Business Name */}
            <Field label="Business Name" icon={<Star className="w-4 h-4" />} required>
              <input name="business_name" value={form.business_name} onChange={handleChange}
                placeholder="e.g. PlastiCo Industries" className={inputCls} />
            </Field>

            {/* Products */}
            <Field label="Products / Services" icon={<Tag className="w-4 h-4" />} required>
              <input name="products" value={form.products} onChange={handleChange}
                placeholder="e.g. Biodegradable packaging, PET bottles" className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              {/* Target Audience */}
              <Field label="Target Audience" icon={<Users className="w-4 h-4" />}>
                <input name="target_audience" value={form.target_audience} onChange={handleChange}
                  placeholder="e.g. Retailers, SMBs" className={inputCls} />
              </Field>
              {/* Location */}
              <Field label="Location" icon={<MapPin className="w-4 h-4" />}>
                <input name="location" value={form.location} onChange={handleChange}
                  placeholder="e.g. Maharashtra, India" className={inputCls} />
              </Field>
            </div>

            {/* USP */}
            <Field label="USP / Unique Strengths" icon={<Star className="w-4 h-4" />}>
              <textarea name="usp" value={form.usp} onChange={handleChange}
                placeholder="e.g. BIS certified, eco-friendly, 20 years experience"
                rows={2} className={`${inputCls} resize-none`} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              {/* Offer */}
              <Field label="Current Offer" icon={<Gift className="w-4 h-4" />}>
                <input name="offer" value={form.offer} onChange={handleChange}
                  placeholder="e.g. 10% off bulk orders" className={inputCls} />
              </Field>
              {/* Contact */}
              <Field label="Contact Info" icon={<Phone className="w-4 h-4" />}>
                <input name="contact" value={form.contact} onChange={handleChange}
                  placeholder="e.g. +91 9876543210" className={inputCls} />
              </Field>
            </div>

            {/* Platform */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Platform</label>
              <div className="grid grid-cols-4 gap-2">
                {platforms.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button key={p.value} onClick={() => setForm((f) => ({ ...f, platform: p.value }))}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-all
                        ${form.platform === p.value
                          ? "bg-purple-500/20 border-purple-500/60 text-purple-300"
                          : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}>
                      <Icon className="w-4 h-4" />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Tone</label>
              <div className="flex flex-wrap gap-2">
                {tones.map((t) => (
                  <button key={t} onClick={() => setForm((f) => ({ ...f, tone: t }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all
                      ${form.tone === t
                        ? "bg-blue-500/20 border-blue-500/60 text-blue-300"
                        : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style (for image) */}
            <Field label="Visual Style (for image)" icon={<ImageIcon className="w-4 h-4" />}>
              <input name="visual_style" value={form.visual_style} onChange={handleChange}
                placeholder="e.g. modern product photography, minimalist white background" className={inputCls} />
            </Field>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button onClick={generateCopy} disabled={loadingCopy}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-all text-white">
                {loadingCopy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loadingCopy ? "Generating..." : "Generate Copy"}
              </button>
              <button onClick={generateImage} disabled={loadingImage}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-all text-white">
                {loadingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                {loadingImage ? "Generating..." : "Generate Image"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Right: Results ── */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <TabBtn active={activeTab === "copy"} onClick={() => setActiveTab("copy")} icon={<Sparkles className="w-4 h-4" />} label="Ad Copy" />
            <TabBtn active={activeTab === "image"} onClick={() => setActiveTab("image")} icon={<ImageIcon className="w-4 h-4" />} label="Ad Image" />
          </div>

          {/* Copy Panel */}
          {activeTab === "copy" && (
            <div className="space-y-4">
              {!adCopy && !loadingCopy && (
                <EmptyState icon={<Sparkles className="w-8 h-8 text-purple-400/50" />}
                  title="No ad copy yet" desc="Fill the form and click Generate Copy" />
              )}
              {loadingCopy && <LoadingCard color="purple" label="Groq AI is writing your ad..." />}
              {adCopy && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Headline */}
                  <CopyCard label="Headline" color="purple"
                    onCopy={() => copyText(adCopy.headline, "headline")} copied={copied === "headline"}>
                    <p className="text-2xl font-bold text-foreground">{adCopy.headline}</p>
                  </CopyCard>

                  {/* Short Caption */}
                  <CopyCard label="Short Caption" color="blue"
                    onCopy={() => copyText(adCopy.shortCaption, "short")} copied={copied === "short"}>
                    <p className="text-foreground/90">{adCopy.shortCaption}</p>
                  </CopyCard>

                  {/* Long Caption */}
                  <CopyCard label="Long Caption" color="emerald"
                    onCopy={() => copyText(adCopy.longCaption, "long")} copied={copied === "long"}>
                    <p className="text-foreground/90 text-sm leading-relaxed">{adCopy.longCaption}</p>
                  </CopyCard>

                  {/* CTA + Format */}
                  <div className="grid grid-cols-2 gap-4">
                    <CopyCard label="CTA" color="yellow"
                      onCopy={() => copyText(adCopy.cta, "cta")} copied={copied === "cta"}>
                      <p className="text-yellow-300 font-semibold">{adCopy.cta}</p>
                    </CopyCard>
                    <CopyCard label="Best Format" color="pink"
                      onCopy={() => copyText(adCopy.bestFormat, "format")} copied={copied === "format"}>
                      <p className="text-pink-300 text-sm">{adCopy.bestFormat}</p>
                    </CopyCard>
                  </div>

                  {/* Ad Lines */}
                  {adCopy.textForAd?.length > 0 && (
                    <CopyCard label="Ad Text Lines" color="orange"
                      onCopy={() => copyText(adCopy.textForAd.join("\n"), "lines")} copied={copied === "lines"}>
                      <ul className="space-y-1">
                        {adCopy.textForAd.map((line: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                            <span className="text-orange-400 font-bold">{i + 1}.</span> {line}
                          </li>
                        ))}
                      </ul>
                    </CopyCard>
                  )}

                  {/* Hashtags */}
                  {adCopy.hashtags?.length > 0 && (
                    <CopyCard label="Hashtags" color="cyan"
                      onCopy={() => copyText(adCopy.hashtags.map((h: string) => `#${h.replace(/^#/, "")}`).join(" "), "hashtags")}
                      copied={copied === "hashtags"}>
                      <div className="flex flex-wrap gap-2">
                        {adCopy.hashtags.map((tag: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-full text-xs">
                            #{tag.replace(/^#/, "")}
                          </span>
                        ))}
                      </div>
                    </CopyCard>
                  )}

                  {/* Visual Recommendation */}
                  {adCopy.visualRecommendation && (
                    <CopyCard label="Visual Recommendation" color="slate"
                      onCopy={() => copyText(adCopy.visualRecommendation, "visual")} copied={copied === "visual"}>
                      <p className="text-muted-foreground text-sm italic">{adCopy.visualRecommendation}</p>
                    </CopyCard>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* Image Panel */}
          {activeTab === "image" && (
            <div>
              {!imageB64 && !loadingImage && (
                <EmptyState icon={<ImageIcon className="w-8 h-8 text-blue-400/50" />}
                  title="No image yet" desc="Fill the form and click Generate Image" />
              )}
              {loadingImage && <LoadingCard color="blue" label="Gemini is painting your ad..." />}
              {imageB64 && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden">
                  <img src={`data:image/png;base64,${imageB64}`} alt="Generated Ad" className="w-full object-cover" />
                  <div className="p-4 flex gap-3">
                    <button onClick={downloadImage}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold transition-all">
                      <Download className="w-4 h-4" /> Download PNG
                    </button>
                    <button onClick={generateImage} disabled={loadingImage}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent/80 hover:bg-accent/80 text-sm font-semibold transition-all">
                      <RefreshCw className="w-4 h-4" /> Regenerate
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
      </div>
    </AuthenticatedShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-white/30 focus:outline-none focus:border-purple-500/60 focus:bg-accent transition-all";

function Field({ label, icon, required, children }: { label: string; icon: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider mb-1.5">
        {icon} {label} {required && <span className="text-purple-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all
        ${active ? "bg-accent hover:bg-accent/80 border-border text-foreground" : "bg-transparent border-transparent text-muted-foreground hover:text-foreground/80"}`}>
      {icon} {label}
    </button>
  );
}

function CopyCard({ label, color, onCopy, copied, children }: {
  label: string; color: string; onCopy: () => void; copied: boolean; children: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    purple: "from-purple-50 border-purple-200 dark:from-purple-900/20 dark:border-purple-800",
    blue: "from-blue-50 border-blue-200 dark:from-blue-900/20 dark:border-blue-800",
    emerald: "from-emerald-50 border-emerald-200 dark:from-emerald-900/20 dark:border-emerald-800",
    yellow: "from-yellow-50 border-yellow-200 dark:from-yellow-900/20 dark:border-yellow-800",
    pink: "from-pink-50 border-pink-200 dark:from-pink-900/20 dark:border-pink-800",
    orange: "from-orange-50 border-orange-200 dark:from-orange-900/20 dark:border-orange-800",
    cyan: "from-cyan-50 border-cyan-200 dark:from-cyan-900/20 dark:border-cyan-800",
    slate: "from-slate-100 border-slate-200 dark:from-slate-800 dark:border-slate-700",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color] || colors.slate} to-transparent border rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <button onClick={onCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground/90 transition-colors px-2 py-1 rounded-lg hover:bg-accent hover:bg-accent/80">
          <Copy className="w-3 h-3" /> {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center bg-muted/30 border border-border rounded-2xl">
      <div className="mb-4">{icon}</div>
      <p className="text-muted-foreground font-medium">{title}</p>
      <p className="text-muted-foreground/60 text-sm mt-1">{desc}</p>
    </div>
  );
}

function LoadingCard({ color, label }: { color: "purple" | "blue"; label: string }) {
  const cls = color === "purple" ? "border-purple-500/30 bg-purple-900/10" : "border-blue-500/30 bg-blue-900/10";
  return (
    <div className={`flex flex-col items-center justify-center py-24 rounded-2xl border ${cls}`}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className={`w-10 h-10 rounded-full border-2 border-t-transparent ${color === "purple" ? "border-purple-500" : "border-blue-500"}`} />
      <p className="mt-4 text-muted-foreground text-sm">{label}</p>
    </div>
  );
}
