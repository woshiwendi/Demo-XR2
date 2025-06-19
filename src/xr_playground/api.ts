// import { initMesh } from '../playground/api';
// import { usePlaygroundStore } from './state/store';
// import { meshType } from '../playground/types';
// import { constructUrl, getCookie } from '../utils'; // ✅ 补全 utils 工具方法

// const playgroundUrl = `${process.env.REACT_APP_BACKEND_URL}/playground`; // ✅ 定义后端基础路径

// export async function loadMesh(mesh: meshType) {
//   const { setLoading, addMesh } = usePlaygroundStore.getState();

//   setLoading({ on: true, progressText: `Loading ${mesh.title}...` });

//   if (mesh.isCurrent) {
//     const detailedMesh = await initMesh(mesh.id);
//     addMesh(detailedMesh);
//   } else {
//     addMesh(mesh);
//   }

//   setLoading({ on: false });
// }

// export async function uploadImage(pid: string, file: File): Promise<{ url: string }> {
//   const data = new FormData();
//   data.set('image_file', file);

//   const res = await fetch(constructUrl(`${playgroundUrl}/image/upload`, { pid }), {
//     method: 'POST',
//     credentials: 'include',
//     headers: {
//       'X-CSRFToken': getCookie('csrftoken')
//     },
//     body: data
//   });

//   return await res.json(); // 期望返回 { url: string }
// }

///home/farazfaruqi/instruct_mesh/frontend/src/xr_playground/api.ts
// custom imports
import { meshJsonType, meshType, playgroundModeType } from "./types"
import { constructUrl, defaultFetchHeaders, getCookie } from "../utils"

export {}

declare global {
  interface Window {
    currentPlaygroundId?: string;
  }
}

const playgroundUrl = `${process.env.REACT_APP_BACKEND_URL}/playground`

export async function getPlayground(id: string): Promise<playgroundModeType> {
    return await (await fetch(constructUrl(playgroundUrl, {id}), {
        method: "GET", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })).json()
}

export async function segmentMesh(uid: string, mid: string): Promise<void> {
    await fetch(constructUrl(`${playgroundUrl}/mesh/segment`, {uid, mid}), {
        method: "POST",
        credentials: "include",
        headers: defaultFetchHeaders()
    })
}

export async function editMesh(id: string, prompt: string, selection: number[]): Promise<void> {
    await fetch(constructUrl(`${playgroundUrl}/mesh/edit`, {mid: id, prompt}), {
        method: "POST",
        credentials: "include",
        headers: defaultFetchHeaders(),
        body: JSON.stringify(selection)
    })
}

export async function updateMesh(id: string, data: Partial<meshType>): Promise<meshType> {
    return await (await fetch(`${playgroundUrl}/mesh/update`, {
        method: "PUT", 
        credentials: "include",
        headers: defaultFetchHeaders(),
        body: JSON.stringify({id, ...data}),
    })).json()
}

export async function getMesh(id: string): Promise<meshType> {
    return await (await fetch(constructUrl(`${playgroundUrl}/mesh`, {id}), {
        method: "GET", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })).json()
}

export async function getMeshData(id: string): Promise<meshJsonType> {
    return await (await fetch(constructUrl(`${playgroundUrl}/mesh/data`, {id}), {
        method: "GET", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })).json()
}

export async function initMesh(id: string): Promise<meshType> {
    let mesh: meshType = await getMesh(id)
    
    const {vertices, faces, uvs, colors} = await getMeshData(id)
    mesh = {...mesh, vertices, faces, uvs, colors} as meshType

    const segments = []
    for (let i = 0; i < mesh.segments.length; i++) {
        segments.push(await initMesh(mesh.segments[i].id))
    }
    mesh.segments = segments

    // TODO: temperary until we update backend to support vertex selection
    return {
        ...mesh,
        unselected: {
            faces: mesh.faces,
            colors: mesh.colors,
            vertices: mesh.vertices,
        },

        selected: {id: `${id}-selected`},
    } as meshType
} 

export async function uploadMesh(pid: string, file: File): Promise<void> {
    const data = new FormData()
    data.set("mesh_file", file)

    await fetch(constructUrl(`${playgroundUrl}/mesh/upload`, {pid}), {
        method: "POST", 
        credentials: "include",
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: data
    })
}