import * as VexSrc from '../src/index.js';
import * as VexTests from '../tests/index.js';
import { Flow } from '../src/flow.js';
import { loadAllMusicFonts } from '../src/fonts/load_all.js';
import { loadTextFonts } from '../src/fonts/textfonts.js';
loadAllMusicFonts();
Flow.setMusicFont('Bravura', 'Gonville', 'Custom');
loadTextFonts();
export * from '../src/index.js';
export * from '../tests/index.js';
export default Object.assign(Object.assign({}, VexSrc), VexTests);
//# sourceMappingURL=vexflow-debug-with-tests.js.map