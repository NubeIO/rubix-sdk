import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GitHubPluginApp } from './GitHubPluginPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GitHubPluginApp
      orgId="test"
      deviceId="device0"
      baseUrl="/api/v1"
    />
  </StrictMode>
);
