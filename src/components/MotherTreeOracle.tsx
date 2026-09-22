import React, { useState, useRef, useEffect } from "react";
import { OracleMessage, Species, UserProfile } from "../types";
import { Sparkles, MessageCircle, Send, HelpCircle, ArrowRight, Loader2, Award, Zap } from "lucide-react";

interface MotherTreeOracleProps {
  rangerProfile: UserProfile;
  motherTreeLevel: number;
  activeSpeciesCount: number;
  onGrantGift: (gift: { seeds: number; sunlight: number; water: number; specialSeed?: string }) => void;
  onUnlockSpecies: (customSpec: Species) => void;
}

const QUICK_PROMPTS = [
  "How do I nurture a harmonious ecosystem?",
  "What is the secret of the glow mushroom?",
  "Mother Tree, please unlock a magical seed!",
  "Suggest a unique plant to grow in my biome.",
];

export default function MotherTreeOracle({
  rangerProfile,
  motherTreeLevel,
  activeSpeciesCount,
  onGrantGift,
  onUnlockSpecies,
}: MotherTreeOracleProps) {
  const [messages, setMessages] = useState<OracleMessage[]>([
    {
      sender: "mother_tree",
      text: "Greetings, child of the sun and soil. I feel the gentle flutter of life in your forest. Ask of my canopy, and I shall whisper the deep secrets of the old-growth.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [unlockedSpeciesResult, setUnlockedSpeciesResult] = useState<Species | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadingStatuses = [
    "Consulting the whispering leaves...",
    "Reaching deep into the root mycelium...",
    "Drawing starlight through the canopy...",
    "Gathering cosmic forest wisdom...",
    "Weaving a gift from the Mother Trunk...",
  ];

  const triggerOracleAPI = async (userText: string) => {
    if (loading) return;

    // Add user message immediately
    const userMsg: OracleMessage = {
      sender: "ranger",
      text: userText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setUnlockedSpeciesResult(null);

    // Dynamic status text loading cycle
    let statusIndex = 0;
    setLoadingStatus(loadingStatuses[0]);
    const statusInterval = setInterval(() => {
      statusIndex = (statusIndex + 1) % loadingStatuses.length;
      setLoadingStatus(loadingStatuses[statusIndex]);
    }, 1500);

    try {
      const response = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rangerName: rangerProfile.name,
          rangerBio: rangerProfile.bio,
          motherTreeLevel,
          activeSpeciesCount,
          message: userText,
        }),
      });

      const json = await response.json();
      clearInterval(statusInterval);

      if (json.success && json.data) {
        const { message, gift } = json.data;

        const treeMsg: OracleMessage = {
          sender: "mother_tree",
          text: message,
          timestamp: Date.now(),
          gift: gift && (gift.seeds > 0 || gift.sunlight > 0 || gift.water > 0 || gift.specialSeed) ? gift : undefined,
        };

        setMessages((prev) => [...prev, treeMsg]);

        // Process Gift if any
        if (gift) {
          onGrantGift(gift);

          // If a custom unique species is recommended/unlocked, create and register it
          if (gift.specialSeed && gift.specialSeed.trim() !== "") {
            const specId = "custom_" + gift.specialSeed.toLowerCase().replace(/[^a-z0-9]/g, "_");
            const newSpec: Species = {
              id: specId,
              name: gift.specialSeed,
              type: "flora",
              description: `A unique cosmic hybrid unlocked by the wisdom of the Mother Tree for Ranger ${rangerProfile.name}.`,
              cost: { sunlight: 40 + motherTreeLevel * 20, water: 45, nutrients: 25, seeds: 5 },
              production: { sunlight: 2, water: 1, nutrients: 1, seeds: 0.5 },
              emoji: "🌸",
              color: "text-amber-300",
              bgGradient: "from-fuchsia-950 to-indigo-950",
              unlockedAtLevel: motherTreeLevel,
              iconName: "Sparkles",
            };
            onUnlockSpecies(newSpec);
            setUnlockedSpeciesResult(newSpec);
          }
        }
      } else {
        throw new Error(json.error || "Mysterious failure in the canopy");
      }
    } catch (err: any) {
      clearInterval(statusInterval);
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "mother_tree",
          text: "The forest hums in quiet deep sleep right now. Ensure your Ranger Secrets are fully hydrated (GEMINI_API_KEY) or check back after a moment's meditation.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    triggerOracleAPI(input.trim());
  };

  return (
    <div id="mother-tree-oracle-panel" className="max-w-md mx-auto p-3 flex flex-col h-[78vh] justify-between">
      {/* Intro Header */}
      <div className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-900/40 p-3 mb-2 shadow-sm flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-800 flex items-center justify-center text-xl shadow-inner animate-mystical">
          🌳
        </div>
        <div>
          <h3 className="font-serif font-bold text-emerald-300 text-sm">Ask the Ancient Mother Tree</h3>
          <p className="text-[10px] text-emerald-400">Unlock unique hybrid species & receive mystical forest elements</p>
        </div>
      </div>

      {/* Message Screen */}
      <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-stone-950/65 rounded-xl border border-stone-900 shadow-inner flex flex-col mb-3">
        {messages.map((m, idx) => {
          const isTree = m.sender === "mother_tree";
          return (
            <div
              key={idx}
              className={`flex flex-col max-w-[85%] ${
                isTree ? "self-start" : "self-end items-end"
              }`}
            >
              <div
                className={`p-3 rounded-xl text-xs leading-relaxed ${
                  isTree
                    ? "bg-emerald-950/50 text-stone-200 border border-emerald-900/30 rounded-tl-none font-serif"
                    : "bg-stone-800 text-stone-100 rounded-tr-none"
                }`}
              >
                {/* Ranger Name Label */}
                {!isTree && (
                  <span className="block text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                    {rangerProfile.name}
                  </span>
                )}
                {isTree && (
                  <span className="block text-[9px] font-bold text-teal-400 uppercase tracking-wider mb-1">
                    🌳 Ancient Mother Tree
                  </span>
                )}

                <p>{m.text}</p>

                {/* Gift Details */}
                {m.gift && (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-950 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-xs text-amber-400">
                      <Zap className="h-3.5 w-3.5 animate-pulse" />
                      Gift Unlocked!
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1 font-medium">
                      {m.gift.seeds > 0 && <span className="bg-emerald-900/60 px-1.5 py-0.5 rounded">🌱 +{m.gift.seeds} Seeds</span>}
                      {m.gift.sunlight > 0 && <span className="bg-emerald-900/60 px-1.5 py-0.5 rounded">☀️ +{m.gift.sunlight} Sun</span>}
                      {m.gift.water > 0 && <span className="bg-emerald-900/60 px-1.5 py-0.5 rounded">💧 +{m.gift.water} Water</span>}
                    </div>
                    {m.gift.specialSeed && (
                      <div className="text-[10px] text-amber-300 bg-amber-950/40 p-1.5 rounded mt-1 border border-amber-900/40">
                        ✨ Unlocked Custom Sprout: <strong className="text-white underline">{m.gift.specialSeed}</strong>! Look inside your Sprout Lab!
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[9px] text-stone-500 mt-0.5 font-mono">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <div className="self-start flex flex-col max-w-[85%]">
            <div className="p-3 rounded-xl bg-emerald-950/30 text-stone-400 border border-emerald-950 rounded-tl-none flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
              <span className="text-xs italic font-serif">{loadingStatus}</span>
            </div>
          </div>
        )}

        {/* Ref node */}
        <div ref={messagesEndRef} />
      </div>

      {/* Custom species reward notification card */}
      {unlockedSpeciesResult && (
        <div className="shrink-0 bg-gradient-to-r from-amber-950/80 to-stone-950/90 border border-amber-500/40 rounded-xl p-3 mb-2 flex items-center gap-3 animate-mystical">
          <div className="text-2xl">🌸</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-amber-300">New Custom Hybrid Discovered!</h4>
            <p className="text-[10px] text-stone-300 truncate font-serif">"{unlockedSpeciesResult.name}" is now purchasable in your Sprout Lab!</p>
          </div>
          <Award className="h-5 w-5 text-amber-400 animate-bounce" />
        </div>
      )}

      {/* Suggestion Quick Taps */}
      <div className="shrink-0 space-y-1.5 mb-2">
        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
          <HelpCircle className="h-3 w-3" /> Quick Whispers
        </span>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => triggerOracleAPI(prompt)}
              disabled={loading}
              className="text-[10px] text-stone-300 bg-stone-900 border border-stone-800 rounded-lg py-1 px-2.5 hover:border-emerald-800 hover:bg-emerald-950/20 hover:text-emerald-300 transition-all text-left truncate max-w-full"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input controls */}
      <div className="shrink-0 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          disabled={loading}
          placeholder="Ask the Mother Tree for eco-advice or element gifts..."
          className="flex-1 rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2.5 text-xs text-stone-200 outline-none focus:border-emerald-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 flex items-center justify-center transition-all disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
