import React, { useState, useEffect, useRef } from "react";
import { Species, PlantedInstance, UserProfile, GameState } from "./types";
import { DEFAULT_SPECIES, getTitleByExp } from "./data";
import EcosystemGrid from "./components/EcosystemGrid";
import SproutShop from "./components/SproutShop";
import MotherTreeOracle from "./components/MotherTreeOracle";
import ProfileEditor from "./components/ProfileEditor";
import {
  Trees,
  Sprout,
  MessageSquare,
  User,
  Sun,
  Droplets,
  FlameKindling,
  Sparkles,
  Award,
  Volume2,
  VolumeX,
  RefreshCw,
  Zap,
} from "lucide-react";

const LOCAL_STORAGE_KEY = "mother_tree_game_state_wildaan";

const INITIAL_PROFILE: UserProfile = {
  name: "Ranger Wildaan",
  title: "Novice Sprouter",
  bio: "Listening to the whispering leaves and letting the soil breathe.",
  favoriteEcosystem: "Luminescent Caverns",
  avatarSeed: "sprout",
  experience: 0,
  developer: "Wildaan Saiyed",
};

const INITIAL_STATE: GameState = {
  resources: {
    sunlight: 40,
    water: 30,
    nutrients: 15,
    seeds: 5,
  },
  motherTree: {
    level: 1,
    experience: 0,
    nextLevelExp: 100,
  },
  planted: [
    // Pre-plant one Glow Fern so they start with some passive generation!
    { id: "start_fern", speciesId: "glow_fern", gridIndex: 5, plantedAt: Date.now(), level: 1 },
  ],
  unlockedCustomSpecies: [],
  profile: INITIAL_PROFILE,
};

export type WeatherState = "sunny" | "rainy" | "foggy" | "windy" | "calm";

export interface WeatherConfig {
  id: WeatherState;
  name: string;
  emoji: string;
  description: string;
  color: string;
  badgeBg: string;
}

export const WEATHERS: WeatherConfig[] = [
  { id: "calm", name: "Calm Breeze", emoji: "🍃", description: "Standard atmospheric rates.", color: "text-stone-300", badgeBg: "bg-stone-900/60 border-stone-850" },
  { id: "sunny", name: "Intense Sunbeams", emoji: "☀️", description: "Sunlight generation boosted by 50%.", color: "text-amber-400", badgeBg: "bg-amber-950/40 border-amber-800/40" },
  { id: "rainy", name: "Canopy Rain", emoji: "🌧️", description: "Water generation boosted by 50%.", color: "text-teal-400", badgeBg: "bg-teal-950/40 border-teal-800/40" },
  { id: "foggy", name: "Mystical Fog", emoji: "🌫️", description: "Nutrients generation boosted by 50%.", color: "text-purple-400", badgeBg: "bg-purple-950/40 border-purple-800/40" },
  { id: "windy", name: "Pollen Breeze", emoji: "💨", description: "Seed generation boosted by 50%.", color: "text-emerald-400", badgeBg: "bg-emerald-950/40 border-emerald-800/40" },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<"ecosystem" | "sprout" | "oracle" | "profile">("ecosystem");
  const [selectedPlantSpecies, setSelectedPlantSpecies] = useState<Species | null>(null);
  
  // Weather system states
  const [currentWeather, setCurrentWeather] = useState<WeatherState>("calm");
  const [weatherAlert, setWeatherAlert] = useState<string | null>(null);

  // Interactive tapping bubbles for visual feedback
  const [tapBubbles, setTapBubbles] = useState<{ id: string; text: string; x: number; y: number }[]>([]);
  
  // Floating passive orbs that players can tap
  const [floatingOrbs, setFloatingOrbs] = useState<{ id: string; type: "sun" | "water" | "nutrient" | "seed"; top: number; left: number }[]>([]);

  // Sound toggles (we use simulated synthesizer audio nodes for retro-magical eco sound effects!)
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Load state from localStorage on init
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.resources && parsed.motherTree) {
          setGameState(parsed);
        }
      } catch (e) {
        console.error("Failed to load saved ecosystem progress", e);
      }
    }
  }, []);

  // Save state to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  // Synthesis Audio Engine (Simple Web Audio API synthesizer for retro eco sound effects!)
  const playSynthesizerTone = (frequency: number, type: OscillatorType = "sine", duration: number = 0.15) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported");
    }
  };

  // Weather Shift Cycle Loop (Every 25 seconds)
  useEffect(() => {
    const cycle = setInterval(() => {
      const nextWeathers = WEATHERS.filter((w) => w.id !== currentWeather);
      const next = nextWeathers[Math.floor(Math.random() * nextWeathers.length)];
      setCurrentWeather(next.id);
      
      // Temporary alert banner
      setWeatherAlert(`${next.emoji} Weather Shift: ${next.name}!`);
      playSynthesizerTone(587.33, "triangle", 0.35); // D5 chime for atmosphere change
      
      setTimeout(() => {
        setWeatherAlert(null);
      }, 3500);
    }, 25000);

    return () => clearInterval(cycle);
  }, [currentWeather, soundEnabled]);

  // Passive Resource Generation Loop (Ticks every 1 second)
  useEffect(() => {
    const allCatalog = [...DEFAULT_SPECIES, ...gameState.unlockedCustomSpecies];

    const interval = setInterval(() => {
      // Calculate totals per second
      let addedSunlight = 0;
      let addedWater = 0;
      let addedNutrients = 0;
      let addedSeeds = 0;

      gameState.planted.forEach((p) => {
        const spec = allCatalog.find((s) => s.id === p.speciesId);
        if (spec) {
          // Linear multiplier based on level
          addedSunlight += spec.production.sunlight * p.level;
          addedWater += spec.production.water * p.level;
          addedNutrients += spec.production.nutrients * p.level;
          addedSeeds += spec.production.seeds * p.level;
        }
      });

      // Mother Tree passive bonuses
      addedSunlight += gameState.motherTree.level * 0.4;
      addedWater += gameState.motherTree.level * 0.2;
      addedNutrients += gameState.motherTree.level * 0.1;

      // Apply weather multipliers (+50% bonus)
      if (currentWeather === "sunny") addedSunlight *= 1.5;
      if (currentWeather === "rainy") addedWater *= 1.5;
      if (currentWeather === "foggy") addedNutrients *= 1.5;
      if (currentWeather === "windy") addedSeeds *= 1.5;

      setGameState((prev) => ({
        ...prev,
        resources: {
          sunlight: Number((prev.resources.sunlight + addedSunlight).toFixed(1)),
          water: Number((prev.resources.water + addedWater).toFixed(1)),
          nutrients: Number((prev.resources.nutrients + addedNutrients).toFixed(1)),
          seeds: Number((prev.resources.seeds + addedSeeds).toFixed(1)),
        },
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.planted, gameState.unlockedCustomSpecies, gameState.motherTree.level, currentWeather]);

  // Floating Orbs Spawner Loop
  useEffect(() => {
    const spawner = setInterval(() => {
      if (floatingOrbs.length >= 5) return;
      
      // 25% chance to spawn an orb
      if (Math.random() < 0.25) {
        const types: ("sun" | "water" | "nutrient" | "seed")[] = ["sun", "water", "nutrient", "seed"];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const newOrb = {
          id: `orb_${Date.now()}_${Math.random()}`,
          type: randomType,
          top: Math.floor(Math.random() * 55) + 15, // Keep it floating within tree bounds
          left: Math.floor(Math.random() * 80) + 10,
        };
        setFloatingOrbs((prev) => [...prev, newOrb]);
      }
    }, 4000);

    return () => clearInterval(spawner);
  }, [floatingOrbs]);

  // Handle Planting a seed
  const handlePlant = (gridIndex: number) => {
    if (!selectedPlantSpecies) return;

    // Deduct resources
    const cost = selectedPlantSpecies.cost;
    if (
      gameState.resources.sunlight < cost.sunlight ||
      gameState.resources.water < cost.water ||
      gameState.resources.nutrients < cost.nutrients ||
      gameState.resources.seeds < cost.seeds
    ) {
      alert("Insufficient life elements to sprout this seed.");
      return;
    }

    const newInstance: PlantedInstance = {
      id: `planted_${Date.now()}_${Math.random()}`,
      speciesId: selectedPlantSpecies.id,
      gridIndex,
      plantedAt: Date.now(),
      level: 1,
    };

    setGameState((prev) => ({
      ...prev,
      resources: {
        sunlight: prev.resources.sunlight - cost.sunlight,
        water: prev.resources.water - cost.water,
        nutrients: prev.resources.nutrients - cost.nutrients,
        seeds: prev.resources.seeds - cost.seeds,
      },
      planted: [...prev.planted, newInstance],
      profile: {
        ...prev.profile,
        experience: prev.profile.experience + 15, // Award Ranger XP
      },
    }));

    playSynthesizerTone(523.25, "sine", 0.3); // C5 note for life spawning
    setSelectedPlantSpecies(null); // Clear planting mode
  };

  // Upgrading an individual plant
  const handleUpgradePlant = (gridIndex: number) => {
    const plantedList = [...gameState.planted];
    const itemIndex = plantedList.findIndex((p) => p.gridIndex === gridIndex);
    if (itemIndex === -1) return;

    const plant = plantedList[itemIndex];
    const allCatalog = [...DEFAULT_SPECIES, ...gameState.unlockedCustomSpecies];
    const spec = allCatalog.find((s) => s.id === plant.speciesId);
    if (!spec) return;

    // Cost formulas
    const cost = {
      sunlight: Math.floor(spec.cost.sunlight * 0.6 * plant.level),
      water: Math.floor(spec.cost.water * 0.6 * plant.level),
      nutrients: Math.floor(spec.cost.nutrients * 0.6 * plant.level),
      seeds: Math.floor(spec.cost.seeds * 0.6 * plant.level),
    };

    if (
      gameState.resources.sunlight < cost.sunlight ||
      gameState.resources.water < cost.water ||
      gameState.resources.nutrients < cost.nutrients ||
      gameState.resources.seeds < cost.seeds
    ) {
      return;
    }

    // Mutate and update
    plant.level += 1;
    setGameState((prev) => ({
      ...prev,
      resources: {
        sunlight: prev.resources.sunlight - cost.sunlight,
        water: prev.resources.water - cost.water,
        nutrients: prev.resources.nutrients - cost.nutrients,
        seeds: prev.resources.seeds - cost.seeds,
      },
      planted: plantedList,
      profile: {
        ...prev.profile,
        experience: prev.profile.experience + 10,
      },
    }));

    playSynthesizerTone(659.25, "triangle", 0.25); // E5 note for growth level up
  };

  // Compost / Harvest a plant
  const handleHarvestPlant = (gridIndex: number) => {
    const plant = gameState.planted.find((p) => p.gridIndex === gridIndex);
    if (!plant) return;

    const allCatalog = [...DEFAULT_SPECIES, ...gameState.unlockedCustomSpecies];
    const spec = allCatalog.find((s) => s.id === plant.speciesId);
    if (!spec) return;

    // Refund 40% of standard cost
    const refund = {
      sunlight: Math.floor(spec.cost.sunlight * 0.4),
      water: Math.floor(spec.cost.water * 0.4),
      nutrients: Math.floor(spec.cost.nutrients * 0.4),
      seeds: Math.floor(spec.cost.seeds * 0.4) + 1,
    };

    setGameState((prev) => ({
      ...prev,
      resources: {
        sunlight: prev.resources.sunlight + refund.sunlight,
        water: prev.resources.water + refund.water,
        nutrients: prev.resources.nutrients + refund.nutrients,
        seeds: prev.resources.seeds + refund.seeds,
      },
      planted: prev.planted.filter((p) => p.gridIndex !== gridIndex),
    }));

    playSynthesizerTone(220.0, "sawtooth", 0.2); // Low refund tone
  };

  // Tap Plant to trigger instant resource burst! (Active game loop)
  const handleTapPlant = (gridIndex: number) => {
    const plant = gameState.planted.find((p) => p.gridIndex === gridIndex);
    if (!plant) return;

    // Generate immediate clicks bonus
    const allCatalog = [...DEFAULT_SPECIES, ...gameState.unlockedCustomSpecies];
    const spec = allCatalog.find((s) => s.id === plant.speciesId);
    if (!spec) return;

    const sunBonus = spec.production.sunlight > 0 ? Math.ceil(spec.production.sunlight * 1.5) : 1;
    const waterBonus = spec.production.water > 0 ? Math.ceil(spec.production.water * 1.2) : 1;

    setGameState((prev) => ({
      ...prev,
      resources: {
        ...prev.resources,
        sunlight: prev.resources.sunlight + sunBonus,
        water: prev.resources.water + waterBonus,
      },
    }));

    // Trigger visual float animation
    const id = `bubble_${Date.now()}_${Math.random()}`;
    const newBubble = {
      id,
      text: `+${sunBonus}☀️ +${waterBonus}💧`,
      x: 35 + Math.random() * 30, // Random percentage coordinate close to tap
      y: 40 + Math.random() * 20,
    };
    setTapBubbles((prev) => [...prev, newBubble]);
    setTimeout(() => {
      setTapBubbles((prev) => prev.filter((b) => b.id !== id));
    }, 1200);

    playSynthesizerTone(880.0, "sine", 0.1); // High pitch spark tone
  };

  // Tap floating resources orbs on screen
  const handleTapOrb = (id: string, type: "sun" | "water" | "nutrient" | "seed") => {
    setFloatingOrbs((prev) => prev.filter((o) => o.id !== id));

    let sunBonus = 0;
    let waterBonus = 0;
    let nutrientBonus = 0;
    let seedBonus = 0;

    if (type === "sun") sunBonus = 15;
    if (type === "water") waterBonus = 12;
    if (type === "nutrient") nutrientBonus = 8;
    if (type === "seed") seedBonus = 3;

    setGameState((prev) => ({
      ...prev,
      resources: {
        sunlight: prev.resources.sunlight + sunBonus,
        water: prev.resources.water + waterBonus,
        nutrients: prev.resources.nutrients + nutrientBonus,
        seeds: prev.resources.seeds + seedBonus,
      },
    }));

    playSynthesizerTone(1046.5, "sine", 0.2); // Sparkling synthesis tone
  };

  // Nurturing & Upgrading the main Mother Tree
  const handleFeedMotherTree = (type: "water" | "nutrient") => {
    const cost = type === "water" ? 25 : 15;
    const resourceVal = type === "water" ? gameState.resources.water : gameState.resources.nutrients;

    if (resourceVal < cost) {
      alert(`Need at least ${cost} units of ${type} to feed the Ancient Roots.`);
      return;
    }

    const addedExp = type === "water" ? 30 : 50;
    let newExp = gameState.motherTree.experience + addedExp;
    let newLvl = gameState.motherTree.level;
    let nextLvlExp = gameState.motherTree.nextLevelExp;

    if (newExp >= nextLvlExp) {
      // Level Up!
      newLvl += 1;
      newExp = newExp - nextLvlExp;
      nextLvlExp = Math.floor(nextLvlExp * 1.5);
      playSynthesizerTone(1318.51, "sine", 0.5); // Majestic chime
      alert(`🎉 Mystical Growth! The Mother Tree has reached Level ${newLvl}! New species catalog levels and higher resource yield parameters are now unlocked.`);
    } else {
      playSynthesizerTone(783.99, "sine", 0.15); // Friendly chime
    }

    setGameState((prev) => ({
      ...prev,
      resources: {
        ...prev.resources,
        water: type === "water" ? prev.resources.water - cost : prev.resources.water,
        nutrients: type === "nutrient" ? prev.resources.nutrients - cost : prev.resources.nutrients,
      },
      motherTree: {
        level: newLvl,
        experience: newExp,
        nextLevelExp: nextLvlExp,
      },
      profile: {
        ...prev.profile,
        experience: prev.profile.experience + addedExp,
      },
    }));
  };

  // Handle Mother Tree Oracle elements gifts
  const handleGrantOracleGift = (gift: { seeds: number; sunlight: number; water: number }) => {
    setGameState((prev) => ({
      ...prev,
      resources: {
        sunlight: prev.resources.sunlight + (gift.sunlight || 0),
        water: prev.resources.water + (gift.water || 0),
        nutrients: prev.resources.nutrients + Math.ceil((gift.sunlight + gift.water) * 0.1),
        seeds: prev.resources.seeds + (gift.seeds || 0),
      },
    }));
    playSynthesizerTone(987.77, "triangle", 0.3);
  };

  // Handle unlock custom species via Gemini
  const handleUnlockCustomSpecies = (newSpec: Species) => {
    setGameState((prev) => {
      // Avoid double additions
      if (prev.unlockedCustomSpecies.some((s) => s.id === newSpec.id)) {
        return prev;
      }
      return {
        ...prev,
        unlockedCustomSpecies: [...prev.unlockedCustomSpecies, newSpec],
      };
    });
  };

  const handleResetGame = () => {
    if (confirm("Are you sure you want to reset your forest ecosystem and start fresh?")) {
      setGameState(INITIAL_STATE);
      setActiveTab("ecosystem");
      playSynthesizerTone(150.0, "sawtooth", 0.4);
    }
  };

  // Calculate active totals of flora types
  const floraCount = gameState.planted.length;

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col font-sans select-none overflow-x-hidden pb-20">
      
      {/* Dynamic Rain Overlay Decoration if water is high or weather is rainy */}
      {(gameState.resources.water > 120 || currentWeather === "rainy") && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-35">
          <div className="absolute top-0 left-[10%] text-sky-400 text-xs animate-raindrop">💧</div>
          <div className="absolute top-0 left-[35%] text-sky-400 text-xs animate-raindrop" style={{ animationDelay: "0.5s" }}>💧</div>
          <div className="absolute top-0 left-[65%] text-sky-400 text-xs animate-raindrop" style={{ animationDelay: "1.2s" }}>💧</div>
          <div className="absolute top-0 left-[85%] text-sky-400 text-xs animate-raindrop" style={{ animationDelay: "0.8s" }}>💧</div>
          {currentWeather === "rainy" && (
            <>
              <div className="absolute top-0 left-[22%] text-teal-400 text-xs animate-raindrop" style={{ animationDelay: "0.3s" }}>💧</div>
              <div className="absolute top-0 left-[50%] text-teal-400 text-xs animate-raindrop" style={{ animationDelay: "0.9s" }}>💧</div>
              <div className="absolute top-0 left-[75%] text-teal-400 text-xs animate-raindrop" style={{ animationDelay: "1.4s" }}>💧</div>
            </>
          )}
        </div>
      )}

      {/* Intense Sunbeams Visual Overlay */}
      {currentWeather === "sunny" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 animate-sunbeams bg-gradient-to-tr from-amber-500/0 via-amber-500/5 to-amber-500/10" />
      )}

      {/* Mystical Fog Visual Overlay */}
      {currentWeather === "foggy" && (
        <div className="absolute inset-x-0 bottom-0 top-1/4 pointer-events-none overflow-hidden z-10 animate-fogdrift bg-gradient-to-t from-white/10 via-purple-500/5 to-transparent blur-md" />
      )}

      {/* Pollen Breeze / Windy Visual Overlay */}
      {currentWeather === "windy" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-40">
          <div className="absolute top-[20%] left-0 text-emerald-400 text-[10px] animate-pollen">🍃</div>
          <div className="absolute top-[45%] left-0 text-emerald-400 text-[10px] animate-pollen" style={{ animationDelay: "1.2s" }}>🍃</div>
          <div className="absolute top-[70%] left-0 text-emerald-400 text-[10px] animate-pollen" style={{ animationDelay: "0.6s" }}>🍃</div>
        </div>
      )}

      {/* Temporary Alert Banner */}
      {weatherAlert && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-stone-950/95 border border-emerald-900/40 text-stone-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <Sparkles className="h-4 w-4 text-emerald-400 animate-spin" />
          {weatherAlert}
        </div>
      )}

      {/* Header Panel with Resource Status Counters */}
      <header className="sticky top-0 bg-stone-950/90 backdrop-blur-md border-b border-stone-800 p-3.5 z-40 shadow-md">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          {/* Top Bar Details */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-900/80 border border-emerald-600 flex items-center justify-center text-lg animate-rustle">
                🌳
              </div>
              <div>
                <h1 className="font-serif text-sm font-bold tracking-wide text-stone-200">Mother Tree</h1>
                <p className="text-[10px] text-stone-400">Ranger Sanctuary (Wildaan Saiyed)</p>
              </div>
            </div>

            {/* Audio Toggle & Reset */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                  soundEnabled
                    ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
                    : "bg-stone-900 border-stone-800 text-stone-500"
                }`}
                title={soundEnabled ? "Mute Eco-Audio" : "Unmute Eco-Audio"}
              >
                {soundEnabled ? <Volume2 className="h-3.5 w-3.5 animate-pulse" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleResetGame}
                className="p-1.5 rounded-lg border border-stone-800 bg-stone-900 text-stone-500 hover:text-rose-400 transition-colors"
                title="Reset Sanctuary Progress"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Core Resource Badges */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <div className="rounded-lg bg-stone-900 border border-stone-850 px-2 py-1 flex items-center gap-1.5 shadow-inner">
              <Sun className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[9px] text-stone-500 uppercase font-bold tracking-wider leading-none">Sun</span>
                <span className="text-xs font-bold text-amber-400 leading-none block mt-0.5 truncate">{gameState.resources.sunlight}</span>
              </div>
            </div>

            <div className="rounded-lg bg-stone-900 border border-stone-850 px-2 py-1 flex items-center gap-1.5 shadow-inner">
              <Droplets className="h-3.5 w-3.5 text-teal-500 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[9px] text-stone-500 uppercase font-bold tracking-wider leading-none">Water</span>
                <span className="text-xs font-bold text-teal-400 leading-none block mt-0.5 truncate">{gameState.resources.water}</span>
              </div>
            </div>

            <div className="rounded-lg bg-stone-900 border border-stone-850 px-2 py-1 flex items-center gap-1.5 shadow-inner">
              <FlameKindling className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[9px] text-stone-500 uppercase font-bold tracking-wider leading-none">Earth</span>
                <span className="text-xs font-bold text-rose-400 leading-none block mt-0.5 truncate">{gameState.resources.nutrients}</span>
              </div>
            </div>

            <div className="rounded-lg bg-stone-900 border border-stone-850 px-2 py-1 flex items-center gap-1.5 shadow-inner">
              <span className="text-sm shrink-0">🌱</span>
              <div className="min-w-0">
                <span className="block text-[9px] text-stone-500 uppercase font-bold tracking-wider leading-none">Seeds</span>
                <span className="text-xs font-bold text-emerald-400 leading-none block mt-0.5 truncate">{gameState.resources.seeds}</span>
              </div>
            </div>
          </div>

          {/* Weather Status Badge */}
          {(() => {
            const wConf = WEATHERS.find((w) => w.id === currentWeather) || WEATHERS[0];
            return (
              <div className={`mt-1 flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border shadow-sm ${wConf.badgeBg}`}>
                <span className="flex items-center gap-1.5 font-semibold text-stone-300">
                  <span className="text-sm">{wConf.emoji}</span>
                  <span>Atmosphere: <strong className={wConf.color}>{wConf.name}</strong></span>
                </span>
                <span className="text-[10px] text-stone-400 italic">{wConf.description}</span>
              </div>
            );
          })()}
        </div>
      </header>

      {/* Floating Tapping Bubbles Renderer */}
      {tapBubbles.map((bubble) => (
        <span
          key={bubble.id}
          style={{ top: `${bubble.y}%`, left: `${bubble.x}%` }}
          className="absolute z-50 text-xs font-bold bg-emerald-950 border border-emerald-400 text-emerald-300 px-1.5 py-0.5 rounded shadow-lg animate-float-up pointer-events-none"
        >
          {bubble.text}
        </span>
      ))}

      {/* Primary Tab Body Render */}
      <main className="flex-1 w-full relative z-20">
        {activeTab === "ecosystem" && (
          <div className="max-w-md mx-auto p-4 space-y-4">
            
            {/* The Giant Mother Tree Centerpiece */}
            <div className="relative overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 p-5 shadow-xl animate-mystical">
              {/* Mother Tree Title & Stats */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-stone-200 text-lg flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
                    Mother Trunk
                  </h3>
                  <p className="text-[10px] text-stone-400">Global passive multiplier active</p>
                </div>
                <span className="bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold font-serif px-2.5 py-1 rounded-full shadow-inner">
                  Level {gameState.motherTree.level}
                </span>
              </div>

              {/* Big tree illustration graphic using clever Tailwind art */}
              <div className="relative h-28 flex items-center justify-center my-2 pointer-events-none">
                {/* Crown glow circles */}
                <div className="absolute w-24 h-24 bg-emerald-500/10 rounded-full blur-xl animate-pulse" />
                <div className="absolute w-12 h-12 bg-teal-500/10 rounded-full blur-md" />

                {/* Styled trunk & leaf emoji */}
                <div className="text-6xl z-10 animate-rustle">🌳</div>
              </div>

              {/* Mother Tree Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span>Growth progress to next level</span>
                  <span className="font-semibold">{gameState.motherTree.experience} / {gameState.motherTree.nextLevelExp} EXP</span>
                </div>
                <div className="h-2 w-full rounded-full bg-stone-900 border border-stone-800 overflow-hidden shadow-inner">
                  <div
                    style={{ width: `${Math.min(100, (gameState.motherTree.experience / gameState.motherTree.nextLevelExp) * 100)}%` }}
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full transition-all duration-300 shadow"
                  />
                </div>
              </div>

              {/* Root Nurturing Actions */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-stone-900 mt-4 text-xs">
                <button
                  onClick={() => handleFeedMotherTree("water")}
                  disabled={gameState.resources.water < 25}
                  className="rounded-xl border border-teal-900 bg-teal-950/20 hover:bg-teal-950/60 p-2.5 flex items-center justify-center gap-1.5 font-bold transition-all disabled:opacity-40"
                  title="Spend 25 Water to grant 30 EXP"
                >
                  <Droplets className="h-4 w-4 text-teal-400" />
                  Feed Water <span className="text-[10px] text-stone-400">(25💧)</span>
                </button>
                <button
                  onClick={() => handleFeedMotherTree("nutrient")}
                  disabled={gameState.resources.nutrients < 15}
                  className="rounded-xl border border-rose-900 bg-rose-950/20 hover:bg-rose-950/60 p-2.5 flex items-center justify-center gap-1.5 font-bold transition-all disabled:opacity-40"
                  title="Spend 15 Nutrients to grant 50 EXP"
                >
                  <FlameKindling className="h-4 w-4 text-rose-400" />
                  Feed Earth <span className="text-[10px] text-stone-400">(15🪱)</span>
                </button>
              </div>
            </div>

            {/* Ecosystem Grid Title */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                <Trees className="h-3.5 w-3.5" /> Canopy Soil Map ({floraCount} / 16 planted)
              </span>
              {selectedPlantSpecies && (
                <span className="text-xs text-amber-400 bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded font-bold animate-pulse">
                  Planting Mode Active
                </span>
              )}
            </div>

            {/* Ecosystem Grid Canvas */}
            <EcosystemGrid
              planted={gameState.planted}
              customSpecies={gameState.unlockedCustomSpecies}
              resources={gameState.resources}
              onPlant={handlePlant}
              onTapPlant={handleTapPlant}
              onUpgradePlant={handleUpgradePlant}
              onHarvestPlant={handleHarvestPlant}
              selectedPlantSpecies={selectedPlantSpecies}
              floatingOrbs={floatingOrbs}
              onTapOrb={handleTapOrb}
            />
          </div>
        )}

        {activeTab === "sprout" && (
          <SproutShop
            resources={gameState.resources}
            motherTreeLevel={gameState.motherTree.level}
            customSpeciesList={gameState.unlockedCustomSpecies}
            onSelectToPlant={(spec) => {
              setSelectedPlantSpecies(spec);
              setActiveTab("ecosystem"); // Jump to grid view so they can choose a slot!
            }}
            selectedPlantSpecies={selectedPlantSpecies}
            cancelPlanting={() => setSelectedPlantSpecies(null)}
          />
        )}

        {activeTab === "oracle" && (
          <MotherTreeOracle
            rangerProfile={gameState.profile}
            motherTreeLevel={gameState.motherTree.level}
            activeSpeciesCount={gameState.planted.length}
            onGrantGift={handleGrantOracleGift}
            onUnlockSpecies={handleUnlockCustomSpecies}
          />
        )}

        {activeTab === "profile" && (
          <ProfileEditor
            profile={gameState.profile}
            setProfile={(p) => setGameState((prev) => ({ ...prev, profile: p }))}
            plantedCount={gameState.planted.length}
            motherTreeLevel={gameState.motherTree.level}
          />
        )}
      </main>

      {/* Persistent Bottom Tab Navigation optimized for Mobile Tapping (Touch Targets 44px) */}
      <nav className="fixed bottom-0 inset-x-0 h-16 bg-stone-950 border-t border-stone-850 z-50 flex items-center justify-around px-4 shadow-xl select-none">
        <button
          onClick={() => setActiveTab("ecosystem")}
          className={`flex flex-col items-center justify-center h-full min-w-[65px] transition-all ${
            activeTab === "ecosystem" ? "text-emerald-400" : "text-stone-500 hover:text-stone-300"
          }`}
          style={{ minHeight: "44px" }}
        >
          <Trees className="h-5.5 w-5.5" />
          <span className="text-[9px] font-bold tracking-wider uppercase mt-1">Sanctuary</span>
        </button>

        <button
          onClick={() => setActiveTab("sprout")}
          className={`flex flex-col items-center justify-center h-full min-w-[65px] transition-all ${
            activeTab === "sprout" ? "text-emerald-400" : "text-stone-500 hover:text-stone-300"
          }`}
          style={{ minHeight: "44px" }}
        >
          <Sprout className="h-5.5 w-5.5" />
          <span className="text-[9px] font-bold tracking-wider uppercase mt-1">Sprout Lab</span>
        </button>

        <button
          onClick={() => setActiveTab("oracle")}
          className={`flex flex-col items-center justify-center h-full min-w-[65px] transition-all relative ${
            activeTab === "oracle" ? "text-emerald-400" : "text-stone-500 hover:text-stone-300"
          }`}
          style={{ minHeight: "44px" }}
        >
          <MessageSquare className="h-5.5 w-5.5 animate-pulse" />
          <span className="text-[9px] font-bold tracking-wider uppercase mt-1">Ask Tree</span>
          {/* Subtle sparkle indicator of Gemini AI availability */}
          <span className="absolute top-2.5 right-3.5 h-1.5 w-1.5 rounded-full bg-indigo-400" />
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center justify-center h-full min-w-[65px] transition-all ${
            activeTab === "profile" ? "text-emerald-400" : "text-stone-500 hover:text-stone-300"
          }`}
          style={{ minHeight: "44px" }}
        >
          <User className="h-5.5 w-5.5" />
          <span className="text-[9px] font-bold tracking-wider uppercase mt-1">Ranger ID</span>
        </button>
      </nav>
    </div>
  );
}
