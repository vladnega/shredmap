/**
 * Augments @types/google.maps for APIs present in the weekly channel but not yet in the published types.
 * See https://developers.google.com/maps/documentation/javascript/mapcolorscheme
 */
declare namespace google.maps {
  enum ColorScheme {
    DARK = 'DARK',
    LIGHT = 'LIGHT',
    FOLLOW_SYSTEM = 'FOLLOW_SYSTEM',
  }

  interface CoreLibrary {
    ColorScheme: typeof ColorScheme;
  }

  interface MapOptions {
    colorScheme?: ColorScheme | string;
  }
}
