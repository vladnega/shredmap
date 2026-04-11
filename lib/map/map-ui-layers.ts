/**
 * Z-index scale for the homepage map shell.
 *
 * Fixed map chrome (branding + auth) must stay **below** the desktop park
 * detail panel so the panel header/close control is not covered.
 */
export const MAP_UI_LAYER_Z = {
  /** Fixed header (branding + auth) — below desktop panel so close isn’t covered */
  mapChrome: 20,
  desktopParkPanel: 30,
  mobileParkPanel: 50,
  mapErrorToast: 30,
} as const;
