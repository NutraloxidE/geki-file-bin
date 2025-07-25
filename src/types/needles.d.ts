declare module '@domchristie/needles' {
  interface LoudnessMeterOptions {
    source: AudioNode;
    modes?: string[];
  }

  interface LoudnessMeterController {
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    reset(): void;
    state: string;
    addEventListener(event: string, handler: (event: any) => void): void;
    removeEventListener(event: string, handler: (event: any) => void): void;
  }

  export function LoudnessMeter(options: LoudnessMeterOptions): LoudnessMeterController;
}
