import { useEffect, useState } from 'react';
import { usePlaygroundStore } from '../state/store';
import { selector } from '../state';
import { useShallow } from 'zustand/react/shallow';

export default function XRMeshControls() {
  const { selected, getMesh, updateMesh } = usePlaygroundStore(useShallow(selector));
  const [mode, setMode] = useState<'chat' | 'settings'>('chat');

  useEffect(() => {
    const meshId = selected[0];
    const mesh = meshId ? getMesh(meshId) : null;

    const input = document.getElementById('mesh-title-input') as HTMLInputElement;
    const chatBtn = document.getElementById('chat-btn');
    const settingsBtn = document.getElementById('settings-btn');

    if (input && mesh) {
      input.value = mesh.title ?? '';
    }

    const onInputChange = () => {
      const newTitle = input?.value;
      if (newTitle && mesh && newTitle !== mesh.title) {
        updateMesh({ ...mesh, title: newTitle }as any);
      }
    };

    const onChatClick = () => setMode('chat');
    const onSettingsClick = () => setMode('settings');

    input?.addEventListener('change', onInputChange);
    chatBtn?.addEventListener('click', onChatClick);
    settingsBtn?.addEventListener('click', onSettingsClick);

    return () => {
      input?.removeEventListener('change', onInputChange);
      chatBtn?.removeEventListener('click', onChatClick);
      settingsBtn?.removeEventListener('click', onSettingsClick);
    };
  }, [selected]);

  useEffect(() => {
    const panel = document.getElementById('mesh-control-panel');
    if (!panel) return;

    const chatUI = document.createElement('div');
    const settingsUI = document.createElement('div');

    chatUI.id = 'chat-panel';
    settingsUI.id = 'settings-panel';
    chatUI.textContent = 'Chat UI coming soon...';
    settingsUI.textContent = 'Settings UI coming soon...';

    chatUI.style.marginTop = '12px';
    settingsUI.style.marginTop = '12px';

    const prevChat = document.getElementById('chat-panel');
    const prevSettings = document.getElementById('settings-panel');
    prevChat?.remove();
    prevSettings?.remove();

    if (mode === 'chat') {
      panel.appendChild(chatUI);
    } else {
      panel.appendChild(settingsUI);
    }
  }, [mode]);

  return null; // 纯逻辑组件，不渲染 React DOM
}
