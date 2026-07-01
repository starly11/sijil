import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeSubjectFilter: string | null;
  activeGradeFilter: number | null;
  setSidebarOpen: (open: boolean) => void;
  setSubjectFilter: (subjectSlug: string | null) => void;
  setGradeFilter: (grade: number | null) => void;
  resetFilters: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  activeSubjectFilter: null,
  activeGradeFilter: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSubjectFilter: (slug) => set({ activeSubjectFilter: slug }),
  setGradeFilter: (grade) => set({ activeGradeFilter: grade }),
  resetFilters: () => set({ activeSubjectFilter: null, activeGradeFilter: null }),
}));
