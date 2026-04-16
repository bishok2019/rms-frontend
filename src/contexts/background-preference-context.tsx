import React, { createContext, useContext } from "react";

type BackgroundPreferenceContextType = {
  bgImagesEnabled: boolean;
  setBgImagesEnabled: (enabled: boolean) => void;
};

const BackgroundPreferenceContext = createContext<BackgroundPreferenceContextType | undefined>(undefined);

type BackgroundPreferenceProviderProps = {
  value: BackgroundPreferenceContextType;
  children: React.ReactNode;
};

export function BackgroundPreferenceProvider({ value, children }: BackgroundPreferenceProviderProps) {
  return (
    <BackgroundPreferenceContext.Provider value={value}>
      {children}
    </BackgroundPreferenceContext.Provider>
  );
}

export function useBackgroundPreference() {
  const context = useContext(BackgroundPreferenceContext);
  if (!context) {
    throw new Error("useBackgroundPreference must be used within BackgroundPreferenceProvider");
  }
  return context;
}
