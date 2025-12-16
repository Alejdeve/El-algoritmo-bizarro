export interface ScriptRequest {
  toolName: string;
  toneIntensity: number; // 1-10 sarcasmo
  podcastName: string;
  hostName: string;
}

export interface GeneratedScript {
  title: string;
  content: string;
  toolName: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
