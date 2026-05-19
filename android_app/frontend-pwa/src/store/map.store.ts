import { create } from 'zustand';
import type { Site } from '../types';

interface MapState {
  selectedSite: Site | null;
  bounds: [[number, number], [number, number]] | null;
  
  // actions
  setSelectedSite: (site: Site | null) => void;
  setBounds: (bounds: [[number, number], [number, number]]) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedSite: null,
  bounds: null,

  setSelectedSite: (site) => set({ selectedSite: site }),
  setBounds: (bounds) => set({ bounds }),
}));
