import { Modifier } from './modifier';
import { StaveNote } from './stavenote';
import { TabNote } from './tabnote';
import { Tickable } from './tickable';
export interface ModifierContextState {
    right_shift: number;
    left_shift: number;
    text_line: number;
    top_text_line: number;
}
export interface ModifierContextMetrics {
    width: number;
    spacing: number;
}
export type ModifierContextMember = Tickable | Modifier | StaveNote | TabNote;
export declare class ModifierContext {
    static DEBUG: boolean;
    protected state: ModifierContextState;
    protected members: Record<string, ModifierContextMember[]>;
    protected preFormatted: boolean;
    protected postFormatted: boolean;
    protected formatted: boolean;
    protected width: number;
    protected spacing: number;
    addModifier(member: ModifierContextMember): this;
    addMember(member: ModifierContextMember): this;
    getModifiers(category: string): ModifierContextMember[];
    getMembers(category: string): ModifierContextMember[];
    getWidth(): number;
    getLeftShift(): number;
    getRightShift(): number;
    getState(): ModifierContextState;
    getMetrics(): ModifierContextMetrics;
    preFormat(): void;
    postFormat(): void;
}
//# sourceMappingURL=modifiercontext.d.ts.map