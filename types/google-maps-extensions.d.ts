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

    mapId?: string;

  }



  interface MarkerLibrary {

    AdvancedMarkerElement: typeof marker.AdvancedMarkerElement;

    PinElement: typeof marker.PinElement;

  }

}



declare namespace google.maps.marker {

  interface AdvancedMarkerElementOptions {

    map?: google.maps.Map | null;

    position?: google.maps.LatLng | google.maps.LatLngLiteral | null;

    title?: string;

    content?: Node | null;

    gmpDraggable?: boolean;

    zIndex?: number;

  }



  class AdvancedMarkerElement extends HTMLElement {

    constructor(options?: AdvancedMarkerElementOptions);

    map: google.maps.Map | null;

    position: google.maps.LatLng | google.maps.LatLngLiteral | null;

    title: string;

    content: Node | null;

    gmpDraggable: boolean;

    zIndex?: number;

    addListener(

      eventName: string,

      handler: (...args: unknown[]) => void,

    ): google.maps.MapsEventListener;

  }



  interface PinElementOptions {

    background?: string;

    borderColor?: string;

    glyphColor?: string;

    glyph?: string | Element;

    scale?: number;

  }



  class PinElement {

    constructor(options?: PinElementOptions);

    element: HTMLElement;

    background: string;

    borderColor: string;

    glyphColor: string;

    glyph: string | Element;

    scale: number;

  }

}


