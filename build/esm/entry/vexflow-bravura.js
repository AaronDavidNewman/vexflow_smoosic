import { Flow } from '../src/flow.js';
import { loadBravura } from '../src/fonts/load_bravura.js';
import { loadCustom } from '../src/fonts/load_custom.js';
import { loadTextFonts } from '../src/fonts/textfonts.js';
loadBravura();
loadCustom();
Flow.setMusicFont('Bravura', 'Custom');
loadTextFonts();
export * from '../src/index.js';
export * as default from '../src/index.js';
//# sourceMappingURL=vexflow-bravura.js.map