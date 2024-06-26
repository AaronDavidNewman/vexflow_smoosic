import { BoundingBox, Bounds } from './boundingbox';
import { Element, ElementStyle } from './element';
import { FontInfo } from './font';
import { BarlineType } from './stavebarline';
import { StaveModifier } from './stavemodifier';
import { StaveTempoOptions } from './stavetempo';
export interface StaveLineConfig {
    visible?: boolean;
}
export interface StaveOptions {
    bottom_text_position?: number;
    line_config?: StaveLineConfig[];
    space_below_staff_ln?: number;
    space_above_staff_ln?: number;
    vertical_bar_width?: number;
    fill_style?: string;
    left_bar?: boolean;
    right_bar?: boolean;
    spacing_between_lines_px?: number;
    top_text_position?: number;
    num_lines?: number;
}
export declare class Stave extends Element {
    static get CATEGORY(): string;
    static TEXT_FONT: Required<FontInfo>;
    readonly options: Required<StaveOptions>;
    protected start_x: number;
    protected clef: string;
    protected endClef?: string;
    protected x: number;
    protected y: number;
    protected width: number;
    protected height: number;
    protected formatted: boolean;
    protected end_x: number;
    protected measure: number;
    protected bounds: Bounds;
    protected readonly modifiers: StaveModifier[];
    protected defaultLedgerLineStyle: ElementStyle;
    static get defaultPadding(): number;
    static get rightPadding(): number;
    constructor(x: number, y: number, width: number, options?: StaveOptions);
    setDefaultLedgerLineStyle(style: ElementStyle): void;
    getDefaultLedgerLineStyle(): ElementStyle;
    space(spacing: number): number;
    resetLines(): void;
    setNoteStartX(x: number): this;
    getNoteStartX(): number;
    getNoteEndX(): number;
    getTieStartX(): number;
    getTieEndX(): number;
    getX(): number;
    getNumLines(): number;
    setNumLines(n: number): this;
    setY(y: number): this;
    getY(): number;
    getTopLineTopY(): number;
    getBottomLineBottomY(): number;
    setX(x: number): this;
    setWidth(width: number): this;
    getWidth(): number;
    getStyle(): ElementStyle;
    setMeasure(measure: number): this;
    getMeasure(): number;
    getModifierXShift(index?: number): number;
    setRepetitionType(type: number, yShift?: number): this;
    setVoltaType(type: number, number_t: string, y: number): this;
    setSection(section: string, y: number, xOffset?: number, fontSize?: number, drawRect?: boolean): this;
    setTempo(tempo: StaveTempoOptions, y: number): this;
    setText(text: string, position: number, options?: {
        shift_x?: number;
        shift_y?: number;
        justification?: number;
    }): this;
    getHeight(): number;
    getSpacingBetweenLines(): number;
    getBoundingBox(): BoundingBox;
    getBottomY(): number;
    getBottomLineY(): number;
    getYForLine(line: number): number;
    getLineForY(y: number): number;
    getYForTopText(line?: number): number;
    getYForBottomText(line?: number): number;
    getYForNote(line: number): number;
    getYForGlyphs(): number;
    addModifier(modifier: StaveModifier, position?: number): this;
    addEndModifier(modifier: StaveModifier): this;
    setBegBarType(type: number | BarlineType): this;
    setEndBarType(type: number | BarlineType): this;
    setClefLines(clefSpec: string): this;
    setClef(clefSpec: string, size?: string, annotation?: string, position?: number): this;
    getClef(): string;
    setEndClef(clefSpec: string, size?: string, annotation?: string): this;
    getEndClef(): string | undefined;
    setKeySignature(keySpec: string, cancelKeySpec?: string, position?: number): this;
    setEndKeySignature(keySpec: string, cancelKeySpec?: string): this;
    setTimeSignature(timeSpec: string, customPadding?: number, position?: number): this;
    setEndTimeSignature(timeSpec: string, customPadding?: number): this;
    addKeySignature(keySpec: string, cancelKeySpec?: string, position?: number): this;
    addClef(clef: string, size?: string, annotation?: string, position?: number): this;
    addEndClef(clef: string, size?: string, annotation?: string): this;
    addTimeSignature(timeSpec: string, customPadding?: number, position?: number): this;
    addEndTimeSignature(timeSpec: string, customPadding?: number): this;
    addTrebleGlyph(): this;
    getModifiers(position?: number, category?: string): StaveModifier[];
    sortByCategory(items: StaveModifier[], order: Record<string, number>): void;
    format(): void;
    draw(): this;
    getVerticalBarWidth(): number;
    getConfigForLines(): StaveLineConfig[];
    setConfigForLine(line_number: number, line_config: StaveLineConfig): this;
    setConfigForLines(lines_configuration: StaveLineConfig[]): this;
    static formatBegModifiers(staves: Stave[]): void;
}
//# sourceMappingURL=stave.d.ts.map