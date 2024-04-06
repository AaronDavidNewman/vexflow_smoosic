import { Element } from './element';
import { Fraction } from './fraction';
import { RenderContext } from './rendercontext';
import { StemmableNote } from './stemmablenote';
import { Voice } from './voice';
export declare const BEAM_LEFT = "L";
export declare const BEAM_RIGHT = "R";
export declare const BEAM_BOTH = "B";
export type PartialBeamDirection = typeof BEAM_LEFT | typeof BEAM_RIGHT | typeof BEAM_BOTH;
export declare class Beam extends Element {
    static get CATEGORY(): string;
    render_options: {
        flat_beam_offset?: number;
        flat_beams: boolean;
        secondary_break_ticks?: number;
        show_stemlets: boolean;
        beam_width: number;
        max_slope: number;
        min_slope: number;
        slope_iterations: number;
        slope_cost: number;
        stemlet_extension: number;
        partial_beam_length: number;
        min_flat_beam_offset: number;
    };
    notes: StemmableNote[];
    postFormatted: boolean;
    slope: number;
    private readonly stem_direction;
    private readonly ticks;
    private y_shift;
    private break_on_indices;
    private beam_count;
    private unbeamable?;
    private forcedPartialDirections;
    getStemDirection(): number;
    static getDefaultBeamGroups(time_sig: string): Fraction[];
    static applyAndGetBeams(voice: Voice, stem_direction?: number, groups?: Fraction[]): Beam[];
    static generateBeams(notes: StemmableNote[], config?: {
        flat_beam_offset?: number;
        flat_beams?: boolean;
        secondary_breaks?: string;
        show_stemlets?: boolean;
        maintain_stem_directions?: boolean;
        beam_middle_only?: boolean;
        beam_rests?: boolean;
        groups?: Fraction[];
        stem_direction?: number;
    }): Beam[];
    constructor(notes: StemmableNote[], auto_stem?: boolean);
    getNotes(): StemmableNote[];
    getBeamCount(): number;
    breakSecondaryAt(indices: number[]): this;
    setPartialBeamSideAt(noteIndex: number, side: PartialBeamDirection): this;
    unsetPartialBeamSideAt(noteIndex: number): this;
    getSlopeY(x: number, first_x_px: number, first_y_px: number, slope: number): number;
    calculateSlope(): void;
    calculateFlatSlope(): void;
    getBeamYToDraw(): number;
    applyStemExtensions(): void;
    lookupBeamDirection(duration: string, prev_tick: number, tick: number, next_tick: number, noteIndex: number): PartialBeamDirection;
    getBeamLines(duration: string): {
        start: number;
        end?: number;
    }[];
    protected drawStems(ctx: RenderContext): void;
    protected drawBeamLines(ctx: RenderContext): void;
    preFormat(): this;
    postFormat(): void;
    draw(): void;
}
//# sourceMappingURL=beam.d.ts.map