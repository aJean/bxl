/**
 * @file ui interface defintation 
 */

export interface IPluggableUI {
    container: any;
    element: any;

    getElement(): HTMLElement;

    setContainer(container: HTMLElement): void;

    show(): void;

    hide(): void;

    dispose(): void;
}