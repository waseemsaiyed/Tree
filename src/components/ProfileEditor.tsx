import React, { useState } from "react";
import { UserProfile } from "../types";
import { User, Sparkles, Award, Shield, Save, BookOpen, Compass, Check } from "lucide-react";
import { getTitleByExp } from "../data";

interface ProfileEditorProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  plantedCount: number;
  motherTreeLevel: number;
}

const AVATAR_SEEDS = [
  { id: "sprout", name: "Sprout Green", emoji: "🌱", color: "bg-emerald-950/80 border-emerald-500 text-emerald-300" },
  { id: "solar", name: "Sunray Amber", emoji: "☀️", color: "bg-amber-950/80 border-amber-500 text-amber-300" },
  { id: "fungus", name: "Crimson Spore", emoji: "🍄", color: "bg-rose-950/80 border-rose-500 text-rose-300" },
  { id: "monarch", name: "Monarch Gold", emoji: "🦋", color: "bg-yellow-950/80 border-yellow-500 text-yellow-300" },
  { id: "guardian", name: "Silver Birch", emoji: "🌳", color: "bg-slate-900/80 border-slate-500 text-slate-300" },
  { id: "mystic", name: "Bioluminescent", emoji: "✨", color: "bg-violet-950/80 border-violet-500 text-violet-300" },
];

export default function ProfileEditor({ profile, setProfile, plantedCount, motherTreeLevel }: ProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [favoriteEcosystem, setFavoriteEcosystem] = useState(profile.favoriteEcosystem);
  const [avatarSeed, setAvatarSeed] = useState(profile.avatarSeed);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentTitle = getTitleByExp(profile.experience);

  const handleSave = () => {
    setProfile({
      ...profile,
      name: name.trim() || "Ranger Wildaan",
      bio: bio.trim(),
      favoriteEcosystem: favoriteEcosystem.trim(),
      avatarSeed,
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const selectedAvatar = AVATAR_SEEDS.find((a) => a.id === avatarSeed) || AVATAR_SEEDS[0];

  return (
    <div id="ranger-profile-panel" className="max-w-md mx-auto p-4 space-y-6">
      {/* Ranger ID Card */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-900/50 bg-stone-950 p-6 text-stone-200 shadow-xl animate-mystical">
        {/* Decorative corner leaves */}
        <div className="absolute top-0 right-0 p-3 text-emerald-700/20 select-none pointer-events-none">
          🌿
        </div>
        <div className="absolute bottom-0 left-0 p-3 text-emerald-700/20 select-none pointer-events-none">
          🌱
        </div>

        {/* Ranger Header */}
        <div className="flex items-center gap-4 border-b border-emerald-900/40 pb-4 mb-4">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 text-3xl shadow-md ${selectedAvatar.color}`}>
            {selectedAvatar.emoji}
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-emerald-400 tracking-wide text-xs uppercase">Ranger Credentials</span>
              <Shield className="h-3 w-3 text-emerald-500" />
            </div>
            <h2 className="truncate font-serif text-2xl font-bold text-stone-100">{profile.name}</h2>
            <p className="truncate text-xs font-medium text-emerald-300/80 italic">{currentTitle}</p>
          </div>
        </div>

        {/* Ranger Fields / Details */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Ranger Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={25}
                className="w-full rounded-lg border border-emerald-900 bg-stone-900 px-3 py-2 text-sm text-stone-200 outline-none focus:border-emerald-500"
                placeholder="Ranger Name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Favorite Ecosystem Type</label>
              <input
                type="text"
                value={favoriteEcosystem}
                onChange={(e) => setFavoriteEcosystem(e.target.value)}
                maxLength={35}
                className="w-full rounded-lg border border-emerald-900 bg-stone-900 px-3 py-2 text-sm text-stone-200 outline-none focus:border-emerald-500"
                placeholder="e.g. Rainforest canopy, Luminescent caverns"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Ecosystem Motto & Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={120}
                rows={3}
                className="w-full rounded-lg border border-emerald-900 bg-stone-900 px-3 py-2 text-sm text-stone-200 outline-none focus:border-emerald-500 resize-none"
                placeholder="Write your eco-manifesto..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-3">Choose Ranger Sigil</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_SEEDS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => setAvatarSeed(av.id)}
                    className={`flex aspect-square items-center justify-center rounded-lg border-2 text-2xl transition-all ${
                      avatarSeed === av.id
                        ? "border-emerald-400 scale-105 shadow-md bg-stone-800"
                        : "border-stone-800 hover:border-emerald-900 hover:scale-102 bg-stone-900"
                    }`}
                    title={av.name}
                  >
                    {av.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
              <button
                onClick={() => {
                  setName(profile.name);
                  setBio(profile.bio);
                  setFavoriteEcosystem(profile.favoriteEcosystem);
                  setAvatarSeed(profile.avatarSeed);
                  setIsEditing(false);
                }}
                className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-stone-400 hover:bg-stone-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Ranger Bio / Motto */}
            <div className="rounded-lg bg-emerald-950/20 border border-emerald-900/20 p-3">
              <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mb-1">
                <BookOpen className="h-3 w-3" /> Field Journal Motto
              </p>
              <p className="text-sm italic text-stone-300">
                "{profile.bio || "Observing the whispering trees and letting the soil speak."}"
              </p>
            </div>

            {/* Favorite Ecosystem */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-400 flex items-center gap-1">
                <Compass className="h-4 w-4 text-emerald-500" /> Preferred Biome:
              </span>
              <span className="font-medium text-emerald-300">{profile.favoriteEcosystem || "Temperate Woodlands"}</span>
            </div>

            {/* Core Stats inside ID */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="rounded-lg bg-stone-900/80 p-2.5 text-center border border-emerald-950">
                <div className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Mother Tree Lvl</div>
                <div className="text-lg font-bold text-emerald-400">{motherTreeLevel}</div>
              </div>
              <div className="rounded-lg bg-stone-900/80 p-2.5 text-center border border-emerald-950">
                <div className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Active Species</div>
                <div className="text-lg font-bold text-teal-400">{plantedCount} / 16</div>
              </div>
            </div>

            <div className="flex gap-2 items-center pt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-800/60 bg-emerald-950/40 hover:bg-emerald-950/80 px-4 py-2 text-sm font-semibold text-emerald-300 transition-all"
              >
                <User className="h-4 w-4" />
                Edit Ranger Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="flex items-center gap-2 justify-center rounded-lg bg-emerald-950 border border-emerald-500 text-emerald-300 py-2 px-3 text-sm font-medium animate-bounce shadow-md">
          <Check className="h-4 w-4 text-emerald-400" />
          Ranger profile updated successfully!
        </div>
      )}

      {/* Wildaan Saiyed Developer Badge & Credits */}
      <div className="rounded-2xl border border-stone-800 bg-stone-950/80 p-5 text-stone-300 shadow-md">
        <h3 className="font-serif text-lg font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
          <Sparkles className="h-4 w-4" /> Ranger Guild Registry
        </h3>
        <p className="text-xs text-stone-400 leading-relaxed mb-4">
          The Mother Tree Game ecosystem was mapped and architected under the supervision of Chief Druid-Engineer <strong className="text-stone-200">Wildaan Saiyed</strong>. Keep nurturing your forest to raise global biodiversity scores!
        </p>

        <div className="flex items-center justify-between border-t border-stone-900 pt-3 text-xs">
          <span className="text-stone-500">Developer</span>
          <span className="font-semibold text-emerald-500/90 tracking-wide uppercase">Wildaan Saiyed</span>
        </div>
        <div className="flex items-center justify-between mt-1 text-xs">
          <span className="text-stone-500">Version</span>
          <span className="font-mono text-stone-400">v1.2.0 (Mobile Optimized)</span>
        </div>
      </div>
    </div>
  );
}
