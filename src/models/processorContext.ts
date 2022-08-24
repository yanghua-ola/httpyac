import { EnvironmentConfig } from './environmentConfig';
import { HttpFile } from './httpFile';
import { HttpRegion, ProcessedHttpRegion } from './httpRegion';
import { Request } from './httpRequest';
import { ConsoleLogHandler, RequestLogger, StreamLogger } from './logHandler';
import { RepeatOptions } from './repeatOptions';
import { Variables } from './variables';

export type Dispose = () => void;

export interface Progress {
  divider?: number;
  isCanceled: () => boolean;
  register: (event: () => void) => Dispose;
  report?: (value: { message?: string; increment?: number }) => void;
}

export interface HttpFileSendContext {
  httpFile: HttpFile;
  config?: EnvironmentConfig;
  progress?: Progress;
  httpRegionPredicate?: (obj: HttpRegion) => boolean;
  processedHttpRegions?: Array<ProcessedHttpRegion>;
  scriptConsole?: ConsoleLogHandler;
  logStream?: StreamLogger;
  logResponse?: RequestLogger;
  repeat?: RepeatOptions;
  variables?: Variables;
}

export interface HttpRegionsSendContext extends HttpFileSendContext {
  httpRegions: HttpRegion[];
}

export interface HttpRegionSendContext extends HttpFileSendContext {
  httpRegion: HttpRegion;
}
export interface ProcessorContext extends HttpRegionSendContext {
  variables: Variables;
  request?: Request;
  isMainContext?: boolean;
  options: Record<string, unknown>;
}

export type SendContext = HttpRegionSendContext | HttpFileSendContext | HttpRegionsSendContext;
