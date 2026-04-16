import "./App.css";
import { useEffect, useMemo, useState } from "react";
import useAuthenticationStore from "./pages/Authentication/Store/authenticationStore";
import { BackgroundPreferenceProvider } from "./contexts/background-preference-context";
import { useTheme } from "./contexts/theme-context";
import PrivateRoutes from "./Routes/PrivateRoute";
import PublicRoutes from "./Routes/PublicRoutes";

const LIGHT_QUERIES = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1920&q=80", // plated salad
  "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1920&q=80", // cutlery setup
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1920&q=80", // menu-style bowl
  "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=1920&q=80", // table setting
  "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1920&q=80", // plated food
];

const DARK_QUERIES = [
  "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1920&q=80", // moody dish
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1920&q=80", // dark food table
  "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=1920&q=80", // table cutlery
  "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1920&q=80", // menu item closeup
  "https://images.unsplash.com/photo-1565299585323-38174c4a6ad1?auto=format&fit=crop&w=1920&q=80", // pizza menu item
];

const getRandomItem = (items: string[]) =>
  items[Math.floor(Math.random() * items.length)];

function App() {
  const { theme } = useTheme();
  const isAuthenticated = useAuthenticationStore(
    (state) => state.isAuthenticated
  );
  const [bgImagesEnabled, setBgImagesEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("restaurant-bg-images-enabled");
    if (stored === null) return true;
    return stored === "true";
  });

  const resolvedTheme = useMemo(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  }, [theme]);

  const [bgImage, setBgImage] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("restaurant-bg-images-enabled", String(bgImagesEnabled));
    document.documentElement.setAttribute(
      "data-bg-images",
      bgImagesEnabled ? "true" : "false"
    );
  }, [bgImagesEnabled]);

  useEffect(() => {
    if (!bgImagesEnabled) {
      setBgImage("");
      return;
    }

    const imageUrl =
      resolvedTheme === "dark"
        ? getRandomItem(DARK_QUERIES)
        : getRandomItem(LIGHT_QUERIES);
    setBgImage(imageUrl);
  }, [bgImagesEnabled, resolvedTheme]);

  return (
    <BackgroundPreferenceProvider
      value={{ bgImagesEnabled, setBgImagesEnabled }}
    >
      <div className="relative min-h-screen overflow-x-hidden isolate">
        {bgImagesEnabled ? (
          <div className="fixed inset-0 z-0">
            {bgImage ? (
              <img
                src={bgImage}
                alt="Restaurant background"
                className="h-full w-full object-cover"
              />
            ) : null}
            <div
              className={
                resolvedTheme === "dark"
                  ? "absolute inset-0 bg-black/40"
                  : "absolute inset-0 bg-white/30"
              }
            />
          </div>
        ) : null}

        <div className="relative z-10">
          {isAuthenticated ? <PrivateRoutes /> : <PublicRoutes />}
        </div>
      </div>
    </BackgroundPreferenceProvider>
  );
}

export default App;
