export type SpeciesType = "flora" | "fungi" | "fauna";

export interface ResourceCost {
  sunlight: number;
  water: number;
  nutrients: number;
  seeds: number;
}

export interface ResourceProduction {
  sunlight: number;
  water: number;
  nutrients: number;
  seeds: number;
}

export interface Species {
  id: string;
  name: string;
  type: SpeciesType;
  description: string;
  cost: ResourceCost;
  production: ResourceProduction;
  emoji: string;
  color: string;
  bgGradient: string;
  unlockedAtLevel: number;
  iconName: string;
}

export interface PlantedInstance {
  id: string;
  speciesId: string;
  gridIndex: number;
  plantedAt: number;
  level: number;
  lastTappedAt?: number;
}

export interface UserProfile {
  name: string;
  title: string;
  bio: string;
  favoriteEcosystem: string;
  avatarSeed: string; // Used for creating a beautiful dynamic avatar
  experience: number;
  developer: string;
}

export interface GameState {
  resources: {
    sunlight: number;
    water: number;
    nutrients: number;
    seeds: number;
  };
  motherTree: {
    level: number;
    experience: number;
    nextLevelExp: number;
  };
  planted: PlantedInstance[];
  unlockedCustomSpecies: Species[];
  profile: UserProfile;
}

export interface OracleMessage {
  sender: "ranger" | "mother_tree";
  text: string;
  timestamp: number;
  gift?: {
    seeds: number;
    sunlight: number;
    water: number;
    specialSeed?: string;
  };
}
