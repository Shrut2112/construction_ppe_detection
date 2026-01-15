import { create } from 'zustand';

interface Violation {
  id: string;
  personId: string;
  type: string;
  timestamp: string;
  image?: string;
}

interface ViolationState {
  violations: Violation[];
  addViolation: (v: Violation) => void;
}

export const useViolationStore = create<ViolationState>((set) => ({
  violations: [],
  addViolation: (v) => set((state) => ({ 
    violations: [v, ...state.violations].slice(0, 50) // Keep last 50
  })),
}));