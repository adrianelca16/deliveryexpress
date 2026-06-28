export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  appName: string;
  appIcon: string;
  splashBackground: string;
}

export const defaultBranding: BrandingConfig = {
  primaryColor: "#2563EB",
  secondaryColor: "#B8860B",
  appName: "Enruta",
  appIcon: "🍕",
  splashBackground: "#FFFFFF",
};

export const getBranding = (): BrandingConfig => {
  return {
    primaryColor: process.env.THEME_PRIMARY || defaultBranding.primaryColor,
    secondaryColor: process.env.THEME_SECONDARY || defaultBranding.secondaryColor,
    appName: process.env.APP_NAME || defaultBranding.appName,
    appIcon: process.env.APP_ICON || defaultBranding.appIcon,
    splashBackground: process.env.SPLASH_BG || defaultBranding.splashBackground,
  };
};