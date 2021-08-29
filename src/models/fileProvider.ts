import { PathLike } from './pathLike.js';

export type FileEnconding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'base64url' | 'latin1' | 'binary' | 'hex';


export interface FileProvider{
  exists(fileName: PathLike): Promise<boolean>;
  joinPath(fileName: PathLike, path: string): PathLike;
  extname(fileName: PathLike): string;
  dirname(fileName: PathLike): PathLike | undefined;
  isAbsolute(fileName: PathLike): boolean;
  readFile(fileName: PathLike, encoding: FileEnconding): Promise<string>;
  readBuffer(fileName: PathLike): Promise<Buffer>;
  readdir: (dirname: PathLike) => Promise<string[]>;
  fsPath(fileName: PathLike): string;
  toString(fileName: PathLike): string;
}