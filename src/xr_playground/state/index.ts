// // custom imports
// import { BaseState } from "../../state"

// // third party 

// export interface XRPlaygroundState extends BaseState {
//     // TODO: define state here
// }

// export const selector = (state: XRPlaygroundState) => ({
//     // TODO: define exposed state here
// })



// // xrplayground/state/index.ts

// import { BaseState } from '../../state';

// /**
//  * XRPlaygroundState 定义了 XR 模式下的 store 状态类型。
//  */
// export interface XRPlaygroundState extends BaseState {
//   // 当前形状（立方体 or 球体）
//   shape: 'cube' | 'sphere';

//   // 切换形状的方法
//   setShape: (s: 'cube' | 'sphere') => void;
// }

// /**
//  * selector 用于从全量状态中选择你希望组件订阅的字段。
//  */
// export const selector = (state: XRPlaygroundState) => ({
//   selected: state.selected,
//   loading: state.loading,
//   shape: state.shape,
//   setShape: state.setShape,
// });



// xrplayground/state/index.ts

import { BaseState } from '../../state';
import { meshType } from '../../playground/types';

export interface XRPlaygroundState extends BaseState {
  shape: 'cube' | 'sphere';
  setShape: (s: 'cube' | 'sphere') => void;

  meshes: meshType[];
  addMesh: (mesh: meshType) => void;
  updateMesh: (mesh: meshType) => void;
  getMesh: (id: string) => meshType;
}

/**
 * selector 用于从全量状态中选择你希望组件订阅的字段。
 */
export const selector = (state: XRPlaygroundState) => ({
  selected: state.selected,
  loading: state.loading,
  shape: state.shape,
  meshes: state.meshes,
  setShape: state.setShape,
  addMesh: state.addMesh,
  updateMesh: state.updateMesh,
  getMesh: state.getMesh,
});
