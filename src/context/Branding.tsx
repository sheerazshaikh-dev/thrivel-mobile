import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, absoluteUrl } from '@/services/api';
import type { SiteSettings } from '@/services/types';

export const DEFAULT: SiteSettings = {
  brandName: 'Thrivel ID',
  tagline: 'Private, personalized, expert-reviewed wellness guidance.',
  logoDarkUrl: '/images/defaults/logo-dark.svg',
  logoLightUrl: '/images/defaults/logo-light.svg',
  heroImageUrl: '/images/defaults/hero-wellness.svg',
  authImageUrl: '/images/defaults/auth-wellness.svg',
  checkoutImageUrl: '/images/defaults/checkout-stack.svg',
  dashboardImageUrl: '/images/defaults/dashboard-progress.svg',
  assessmentImageUrl: '/images/defaults/assessment-wellness.svg',
  defaultProductImageUrl: '/images/defaults/product-default.svg',
  primaryColor: '#7AC7C8',
  gradientMidColor: '#9971B1',
  secondaryColor: '#EC437D',
  accentColor: '#F4946E',
  backgroundColor: '#0A1133',
  panelColor: '#101943',
  supportEmail: '',
  footerText: 'Private, secure, and expert-reviewed.',
  loginHeadline: 'Welcome back to your personalized health dashboard',
  loginSubheadline: 'Continue your plan, review your recommendations and track your progress.',
  loginTitle: 'Log in',
  loginDescription: 'Use the email and password created after checkout.',
  signupHeadline: 'Start your personalized wellness plan',
  signupSubheadline: 'Complete the assessment and checkout before creating your account.',
  signupTitle: 'Create your account after payment',
  signupDescription: 'Your assessment, purchase and plan are linked during account creation.',
  accountTitle: 'Create your member account',
  accountDescription: 'This account will own your assessment, order and wellness plan.',
  checkoutTitle: 'Choose your stack and advisor access',
  checkoutDescription: 'Select a package or continue with advisor-only access. Account creation follows payment.',
  dashboardTitle: 'Your wellness dashboard',
  dashboardDescription: 'Your goal, plan, purchased package and reviewer-controlled details are shown here.',
};

type BrandingContextValue = SiteSettings & {
  refreshBranding: () => Promise<void>;
  brandingLoaded: boolean;
};

const C = createContext<BrandingContextValue>({
  ...DEFAULT,
  refreshBranding: async () => undefined,
  brandingLoaded: false,
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT);
  const [brandingLoaded, setBrandingLoaded] = useState(false);

  const refreshBranding = useCallback(async () => {
    try {
      const result = await apiRequest<{ settings: SiteSettings }>('/settings');
      setSettings({ ...DEFAULT, ...(result.settings || {}) });
    } catch {
      setSettings((current) => current || DEFAULT);
    } finally {
      setBrandingLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refreshBranding();
  }, [refreshBranding]);

  const value = useMemo(
    () => ({ ...settings, refreshBranding, brandingLoaded }),
    [settings, refreshBranding, brandingLoaded],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}

export const useBranding = () => useContext(C);

export function remoteBrandImage(value?: string) {
  return value ? absoluteUrl(value) : '';
}
