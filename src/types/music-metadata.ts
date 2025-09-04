declare module 'music-metadata' {
  export interface IFormat {
    duration?: number;
    bitrate?: number;
    sampleRate?: number;
  }

  export interface IAudioMetadata {
    format: IFormat;
    common: {
      title?: string;
      artist?: string;
      album?: string;
    };
  }

  export function parseBuffer(
    buffer: Buffer,
    mimeType?: string,
    options?: Record<string, unknown>
  ): Promise<IAudioMetadata>;
}