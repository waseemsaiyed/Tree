import React from "react";
import { Species, ResourceCost } from "../types";
import { DEFAULT_SPECIES } from "../data";
import { Sprout, Lock, FlameKindling, Droplets, Sun, Sparkles } from "lucide-react";

interface SproutShopProps {
  resources: {
    sunlight: number;
    water: number;
    nutrients: number;
    seeds: number;
  };
  motherTreeLevel: number;
  customSpeciesList: Species[];
  onSelectToPlant: (species: Species) => void;
  selectedPlantSpecies: Species | null;
  cancelPlanting: () => void;
}

export default function SproutShop({
  resources,
  motherTreeLevel,
  customSpeciesList,
  onSelectToPlant,
  selectedPlantSpecies,
  cancelPlanting,
}: SproutShopProps) {
  // Combine defaults and any custom hybrid species unlocked via Gemini
  const allSpecies = [...DEFAULT_SPECIES, ...customSpeciesList];

  const canAfford = (cost: ResourceCost) => {
    return (
      resources.sunlight >= cost.sunlight &&
      resources.water >= cost.water &&
      resources.nutrients >= cost.nutrients &&
      resources.seeds >= cost.seeds
    );
  };

  return (
    <div id="sprout-shop-panel" className="p-4 max-w-md mx-auto space-y-4">
      {/* Planting Mode Banner */}
      {selectedPlantSpecies && (
        <div className="rounded-xl bg-emerald-950 border-2 border-emerald-500 p-4 text-center text-stone-200 animate-bounce shadow-lg">
          <div className="font-bold text-emerald-400 flex items-center justify-center gap-1.5 text-base">
            <Sprout className="h-5 w-5 animate-bounce" />
            Ready to Plant: {selectedPlantSpecies.emoji} {selectedPlantSpecies.name}
          </div>
          <p className="text-xs text-stone-300 mt-1">
            Tap any empty soil grid slot on the forest map to root this species.
          </p>
          <button
            onClick={cancelPlanting}
            className="mt-3 rounded-md bg-stone-800 hover:bg-stone-700 text-xs px-3 py-1.5 font-medium text-stone-400 hover:text-stone-200 transition-colors"
          >
            Cancel Planting
          </button>
        </div>
      )}

      {/* Catalog Grid */}
      <div className="space-y-3">
        <h3 className="font-serif text-lg font-bold text-emerald-400 flex items-center gap-1.5">
          <Sprout className="h-5 w-5" /> Sprout Laboratory Catalog
        </h3>
        <p className="text-xs text-stone-400">
          Synthesize life elements to sprout new biological forms and balance the ecosystem.
        </p>

        <div className="space-y-3">
          {allSpecies.map((spec) => {
            const isLocked = motherTreeLevel < spec.unlockedAtLevel;
            const affordable = canAfford(spec.cost);
            const isSelected = selectedPlantSpecies?.id === spec.id;

            return (
              <div
                key={spec.id}
                className={`relative overflow-hidden rounded-xl border p-3.5 transition-all flex items-center gap-4 ${
                  isSelected
                    ? "border-emerald-400 bg-emerald-950/40"
                    : isLocked
                    ? "border-stone-900 bg-stone-950/40 opacity-70"
                    : "border-stone-800 bg-stone-950/80"
                }`}
              >
                {/* Visual Avatar */}
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
                    spec.bgGradient
                  } border border-emerald-900/30 text-3xl shadow-inner relative`}
                >
                  {spec.emoji}
                  {isLocked && (
                    <div className="absolute inset-0 bg-stone-950/80 flex items-center justify-center rounded-xl">
                      <Lock className="h-5 w-5 text-stone-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-stone-200 text-sm truncate">{spec.name}</h4>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        spec.type === "flora"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-900/40"
                          : spec.type === "fungi"
                          ? "bg-rose-950 text-rose-400 border border-rose-900/40"
                          : "bg-amber-950 text-amber-400 border border-amber-900/40"
                      }`}
                    >
                      {spec.type}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 line-clamp-2 mt-0.5">{spec.description}</p>

                  {/* Production Rates */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2 text-[10px] text-stone-400 font-semibold border-t border-stone-900/60 pt-2">
                    <span className="text-emerald-400">Yield:</span>
                    {spec.production.sunlight > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Sun className="h-3 w-3 text-amber-500" />+{spec.production.sunlight}/s
                      </span>
                    )}
                    {spec.production.water > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Droplets className="h-3 w-3 text-teal-500" />+{spec.production.water}/s
                      </span>
                    )}
                    {spec.production.nutrients > 0 && (
                      <span className="flex items-center gap-0.5">
                        <FlameKindling className="h-3 w-3 text-rose-500" />+{spec.production.nutrients}/s
                      </span>
                    )}
                    {spec.production.seeds > 0 && (
                      <span className="flex items-center gap-0.5 text-yellow-500">
                        🌱+{spec.production.seeds}/s
                      </span>
                    )}
                  </div>

                  {/* Cost list if not locked */}
                  {!isLocked && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] font-bold">
                      <span className="text-stone-500">Cost:</span>
                      {spec.cost.sunlight > 0 && (
                        <span className={resources.sunlight >= spec.cost.sunlight ? "text-amber-400" : "text-stone-600"}>
                          ☀️{spec.cost.sunlight}
                        </span>
                      )}
                      {spec.cost.water > 0 && (
                        <span className={resources.water >= spec.cost.water ? "text-teal-400" : "text-stone-600"}>
                          💧{spec.cost.water}
                        </span>
                      )}
                      {spec.cost.nutrients > 0 && (
                        <span className={resources.nutrients >= spec.cost.nutrients ? "text-rose-400" : "text-stone-600"}>
                          🪱{spec.cost.nutrients}
                        </span>
                      )}
                      {spec.cost.seeds > 0 && (
                        <span className={resources.seeds >= spec.cost.seeds ? "text-yellow-500" : "text-stone-600"}>
                          🌱{spec.cost.seeds}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Buy Button / Locked badge */}
                <div className="shrink-0 flex flex-col items-center">
                  {isLocked ? (
                    <div className="flex flex-col items-center gap-0.5 text-stone-500 text-[10px] font-bold uppercase tracking-wider">
                      <Lock className="h-4 w-4" />
                      <span>Level {spec.unlockedAtLevel}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectToPlant(spec)}
                      disabled={!affordable && !isSelected}
                      className={`text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-all ${
                        isSelected
                          ? "bg-amber-600 hover:bg-amber-500 text-white animate-pulse"
                          : affordable
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-103"
                          : "bg-stone-900 text-stone-600 cursor-not-allowed"
                      }`}
                    >
                      {isSelected ? "Planting" : "Sprout"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
