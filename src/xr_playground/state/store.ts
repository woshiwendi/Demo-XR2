// // custom imports
// import { XRPlaygroundState } from "."
// import { baseState } from "../../state/store"

// // third party
// import { create } from "zustand"

// export const usePlaygroundStore = create<XRPlaygroundState>((set, get) => ({
//     ...baseState<XRPlaygroundState>(set, get),

//     // TODO: implement your state and actions here
// }))

// xrplayground/state/store.ts

// xrplayground/state/store.ts

import { XRPlaygroundState } from './index';
import { create } from 'zustand';
import { meshType } from '../../playground/types';
import { baseState } from '../../state/store';


export const usePlaygroundStore = create<XRPlaygroundState>((set, get) => ({
  ...baseState<XRPlaygroundState>(set, get),

  shape: 'cube',
  setShape: (s: 'cube' | 'sphere') => set({ shape: s }),

  meshes: [],
  addMesh: (mesh: meshType) => {
    const state = get();
    set({ meshes: [...state.meshes, mesh] });
  },
  updateMesh: (mesh: meshType) => {
    const state = get();
    const meshes = state.meshes.map((m) =>
      m.id === mesh.id ? mesh : m
    );
    set({ meshes });
  },
  getMesh: (id: string) => {
    const state = get();
    const mesh = state.meshes.find((m) => m.id === id);
    if (!mesh) throw new Error(`[getMesh] mesh ${id} not found`);
    return mesh;
    },

}));

