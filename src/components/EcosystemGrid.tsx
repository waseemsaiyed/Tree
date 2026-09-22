import React, { useState } from "react";
import { Species, PlantedInstance } from "../types";
import { DEFAULT_SPECIES } from "../data";
import { Trees, Sun, Droplets, FlameKindling, Zap, Plus, X, ArrowUpCircle } from "lucide-react";

interface EcosystemGridProps {
  planted: PlantedInstance[];
  customSpecies: Species[];
  resources: {
    sunlight: number;
    water: number;
    nutrients: number;
    seeds: number;
  };
  onPlant: (gridIndex: number) => void;
  onTapPlant: (gridIndex: number) => void;
  onUpgradePlant: (gridIndex: number) => void;
  onHarvestPlant: (gridIndex: number) => void; // Unplant / compost
  selectedPlantSpecies: Species | null;
  floatingOrbs: { id: string; type: "sun" | "water" | "nutrient" | "seed"; top: number; left: number }[];
  onTapOrb: (id: string, type: "sun" | "water" | "nutrient" | "seed") => void;
}

export default function EcosystemGrid({
  planted,
  customSpecies,
  resources,
  onPlant,
  onTapPlant,
  onUpgradePlant,
  onHarvestPlant,
  selectedPlantSpecies,
  floatingOrbs,
  onTapOrb,
}: EcosystemGridProps) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  const allCatalog = [...DEFAULT_SPECIES, ...customSpecies];

  // Helper to find planted plant at slot
  const getPlantedAt = (index: number) => {
    return planted.find((p) => p.gridIndex === index);
  };

  const getSpeciesOf = (plantedInst: PlantedInstance) => {
    return allCatalog.find((s) => s.id === plantedInst.speciesId);
  };

  // Upgrading costs: scale based on plant level
  const getUpgradeCost = (plantedInst: PlantedInstance) => {
    const spec = getSpeciesOf(plantedInst);
    if (!spec) return { sunlight: 999, water: 999, nutrients: 999, seeds: 999 };
    return {
      sunlight: Math.floor(spec.cost.sunlight * 0.6 * plantedInst.level),
      water: Math.floor(spec.cost.water * 0.6 * plantedInst.level),
      nutrients: Math.floor(spec.cost.nutrients * 0.6 * plantedInst.level),
      seeds: Math.floor(spec.cost.seeds * 0.6 * plantedInst.level),
    };
  };

  const canAffordUpgrade = (plantedInst: PlantedInstance) => {
    const cost = getUpgradeCost(plantedInst);
    return (
      resources.sunlight >= cost.sunlight &&
      resources.water >= cost.water &&
      resources.nutrients >= cost.nutrients &&
      resources.seeds >= cost.seeds
    );
  };

  const handleSlotClick = (index: number) => {
    const plantedInst = getPlantedAt(index);
    if (selectedPlantSpecies && !plantedInst) {
      // In planting mode, plant instantly!
      onPlant(index);
    } else if (plantedInst) {
      // Open plant details modal
      setSelectedSlotIndex(index);
      onTapPlant(index);
    } else {
      // Empty slot tap with no selected plant
      setSelectedSlotIndex(index);
    }
  };

  const selectedInst = selectedSlotIndex !== null ? getPlantedAt(selectedSlotIndex) : null;
  const selectedInstSpec = selectedInst ? getSpeciesOf(selectedInst) : null;

  return (
    <div className="relative p-2 max-w-md mx-auto space-y-4">
      {/* Grid Canvas Frame */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 p-3.5 shadow-xl">
        {/* Sky canopy decoration */}
        <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-teal-950/20 to-transparent pointer-events-none" />

        {/* Floating Resource Orbs Layer */}
        {floatingOrbs.map((orb) => (
          <button
            key={orb.id}
            onClick={() => onTapOrb(orb.id, orb.type)}
            style={{ top: `${orb.top}%`, left: `${orb.left}%` }}
            className={`absolute z-20 h-10 w-10 rounded-full flex items-center justify-center text-lg cursor-pointer transition-all hover:scale-115 active:scale-95 shadow-md border animate-bounce ${
              orb.type === "sun"
                ? "bg-amber-950 border-amber-500 text-amber-300 shadow-amber-500/20 animate-mystical"
                : orb.type === "water"
                ? "bg-teal-950 border-teal-500 text-teal-300 shadow-teal-500/20"
                : orb.type === "nutrient"
                ? "bg-rose-950 border-rose-500 text-rose-300 shadow-rose-500/20"
                : "bg-emerald-950 border-emerald-500 text-emerald-300 shadow-emerald-500/20"
            }`}
          >
            {orb.type === "sun" ? "☀️" : orb.type === "water" ? "💧" : orb.type === "nutrient" ? "🪱" : "🌱"}
          </button>
        ))}

        {/* 4x4 Grid Floor */}
        <div className="grid grid-cols-4 gap-2.5 relative">
          {Array.from({ length: 16 }).map((_, index) => {
            const plantedInst = getPlantedAt(index);
            const spec = plantedInst ? getSpeciesOf(plantedInst) : null;

            return (
              <button
                key={index}
                onClick={() => handleSlotClick(index)}
                className={`aspect-square relative rounded-xl flex flex-col items-center justify-center border transition-all ${
                  plantedInst
                    ? `bg-gradient-to-br ${spec?.bgGradient || "from-stone-900 to-emerald-950"} border-emerald-900/60 active:scale-95 shadow-sm`
                    : selectedPlantSpecies
                    ? "border-dashed border-emerald-500/60 bg-emerald-950/10 hover:bg-emerald-950/30 animate-pulse cursor-pointer"
                    : "border-stone-900 bg-stone-900/40 hover:bg-stone-900/70"
                }`}
              >
                {/* Slot index label or level marker */}
                {plantedInst ? (
                  <span className="absolute top-1 right-1.5 text-[9px] font-mono font-bold bg-stone-950/80 text-emerald-400 px-1 rounded">
                    L{plantedInst.level}
                  </span>
                ) : (
                  <span className="absolute bottom-1 right-1.5 text-[8px] font-mono text-stone-700">
                    #{index + 1}
                  </span>
                )}

                {/* Main Emoji representation of species */}
                {plantedInst && spec ? (
                  <div className="text-3xl animate-rustle flex flex-col items-center">
                    <span>{spec.emoji}</span>
                    <span className="text-[8px] font-bold text-stone-300 tracking-wide mt-1 truncate max-w-[55px]">
                      {spec.name}
                    </span>
                  </div>
                ) : (
                  <div className="text-stone-700 flex flex-col items-center gap-0.5">
                    <Plus className={`h-4 w-4 ${selectedPlantSpecies ? "text-emerald-500" : "text-stone-700"}`} />
                    <span className="text-[8px] font-semibold text-stone-600">soil</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info inside the ecosystem block */}
        <div className="flex items-center justify-between text-[10px] text-stone-500 mt-3.5 border-t border-stone-900/60 pt-2.5">
          <span>Soil Density: Balanced 98%</span>
          <span className="flex items-center gap-1">
            <Trees className="h-3 w-3 text-emerald-600" /> Tap plants to trigger growth sparks
          </span>
        </div>
      </div>

      {/* Grid Item detail / Planting helper modal */}
      {selectedSlotIndex !== null && (
        <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 relative shadow-lg">
          <button
            onClick={() => setSelectedSlotIndex(null)}
            className="absolute top-2.5 right-2.5 text-stone-400 hover:text-stone-200"
          >
            <X className="h-4 w-4" />
          </button>

          {selectedInst && selectedInstSpec ? (
            <div className="space-y-3">
              {/* Plant info */}
              <div className="flex items-center gap-3">
                <div className={`text-4xl p-2 rounded-xl bg-gradient-to-br ${selectedInstSpec.bgGradient} border border-emerald-900/30`}>
                  {selectedInstSpec.emoji}
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-stone-200 flex items-center gap-2">
                    {selectedInstSpec.name} <span className="text-xs bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded">Lvl {selectedInst.level}</span>
                  </h4>
                  <p className="text-xs text-stone-400">{selectedInstSpec.description}</p>
                </div>
              </div>

              {/* Plant yields details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-stone-300 border-y border-stone-900/60 py-2.5">
                <div>
                  <span className="text-stone-500">Hourly Yield Rate:</span>
                  <div className="flex flex-col gap-0.5 mt-1 font-semibold">
                    {selectedInstSpec.production.sunlight > 0 && (
                      <span className="text-amber-400 flex items-center gap-1">☀️ {selectedInstSpec.production.sunlight * selectedInst.level}/s</span>
                    )}
                    {selectedInstSpec.production.water > 0 && (
                      <span className="text-teal-400 flex items-center gap-1">💧 {selectedInstSpec.production.water * selectedInst.level}/s</span>
                    )}
                    {selectedInstSpec.production.nutrients > 0 && (
                      <span className="text-rose-400 flex items-center gap-1">🪱 {selectedInstSpec.production.nutrients * selectedInst.level}/s</span>
                    )}
                    {selectedInstSpec.production.seeds > 0 && (
                      <span className="text-emerald-400 flex items-center gap-1">🌱 {selectedInstSpec.production.seeds * selectedInst.level}/s</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col justify-between items-end">
                  <span className="text-stone-500">Slot Reference:</span>
                  <span className="font-mono text-emerald-400">Soil Slot #{selectedSlotIndex + 1}</span>
                  <button
                    onClick={() => {
                      onHarvestPlant(selectedSlotIndex);
                      setSelectedSlotIndex(null);
                    }}
                    className="text-[10px] bg-red-950/40 hover:bg-red-950 border border-red-900/40 text-red-400 px-2 py-1 rounded"
                    title="Removes plant to retrieve 40% of elements"
                  >
                    Compost / Harvest
                  </button>
                </div>
              </div>

              {/* Upgrade controls */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">Level Up Elements:</div>
                  <div className="flex gap-2 text-xs font-bold mt-1">
                    {getUpgradeCost(selectedInst).sunlight > 0 && (
                      <span className={resources.sunlight >= getUpgradeCost(selectedInst).sunlight ? "text-amber-400" : "text-stone-600"}>
                        ☀️{getUpgradeCost(selectedInst).sunlight}
                      </span>
                    )}
                    {getUpgradeCost(selectedInst).water > 0 && (
                      <span className={resources.water >= getUpgradeCost(selectedInst).water ? "text-teal-400" : "text-stone-600"}>
                        💧{getUpgradeCost(selectedInst).water}
                      </span>
                    )}
                    {getUpgradeCost(selectedInst).nutrients > 0 && (
                      <span className={resources.nutrients >= getUpgradeCost(selectedInst).nutrients ? "text-rose-400" : "text-stone-600"}>
                        🪱{getUpgradeCost(selectedInst).nutrients}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onUpgradePlant(selectedSlotIndex);
                  }}
                  disabled={!canAffordUpgrade(selectedInst)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    canAffordUpgrade(selectedInst)
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-stone-900 text-stone-600 cursor-not-allowed"
                  }`}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  Upgrade Flora
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-stone-400">
              <h4 className="font-bold text-stone-300 mb-1">Ecosystem Soil Block #{selectedSlotIndex + 1}</h4>
              <p className="text-xs text-stone-500 mb-3">This quadrant of forest soil is ready for new life.</p>
              <p className="text-[11px] text-emerald-400">Select a seed in the Sprout Lab tab to plant here!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
