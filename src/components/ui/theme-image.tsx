import { useTheme } from "@/contexts/theme-context";

interface ThemeImageProps {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export function ThemeImage({
  lightSrc,
  darkSrc,
  alt,
  className = "",
  width,
  height
}: ThemeImageProps) {
  const { theme } = useTheme();

  // Determine which image to show based on theme
  const getImageSrc = () => {
    if (theme === "dark") {
      return darkSrc || lightSrc; // Fallback to light if dark not provided
    }
    return lightSrc || darkSrc; // Fallback to dark if light not provided
  };

  return (
    <img
      src={getImageSrc()}
      alt={alt}
      className={className}
      width={width}
      height={height}
    />
  );
}