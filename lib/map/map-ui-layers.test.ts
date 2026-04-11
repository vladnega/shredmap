import { describe, it, expect } from 'vitest';
import { MAP_UI_LAYER_Z } from './map-ui-layers';

describe('map UI layering', () => {
  it('desktop park panel stacks above fixed map chrome (close control not blocked)', () => {
    expect(MAP_UI_LAYER_Z.desktopParkPanel).toBeGreaterThan(
      MAP_UI_LAYER_Z.mapChrome,
    );
  });
});
