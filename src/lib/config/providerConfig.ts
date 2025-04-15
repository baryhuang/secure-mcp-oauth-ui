export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  enabled: boolean;
}

export interface ProviderConfigs {
  [provider: string]: OAuthProviderConfig;
}

// Default provider configurations
export const defaultProviders: string[] = ['github', 'google', 'twitter'];

const CONFIG_KEY = 'oauth_provider_configs';

const isBrowser = typeof window !== 'undefined';

export const saveProviderConfig = (provider: string, config: OAuthProviderConfig) => {
  if (!isBrowser) return;
  const configs = getProviderConfigs();
  configs[provider] = config;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(configs));
};

export const getProviderConfig = (provider: string): OAuthProviderConfig | null => {
  if (!isBrowser) return null;
  const configs = getProviderConfigs();
  return configs[provider] || null;
};

export const getProviderConfigs = (): ProviderConfigs => {
  if (!isBrowser) return {};
  try {
    const configsStr = localStorage.getItem(CONFIG_KEY);
    return configsStr ? JSON.parse(configsStr) : {};
  } catch (error) {
    console.error('Error reading provider configs:', error);
    return {};
  }
};

export const removeProviderConfig = (provider: string) => {
  if (!isBrowser) return;
  const configs = getProviderConfigs();
  delete configs[provider];
  localStorage.setItem(CONFIG_KEY, JSON.stringify(configs));
};
