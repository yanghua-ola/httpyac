import { EnvironmentConfig } from '../models';
import { fileProvider, PathLike, log } from '../io';


export async function toAbsoluteFilename(fileName: PathLike, baseName: PathLike |undefined, isFolder = false) : Promise<PathLike | undefined> {
  if (fileProvider.isAbsolute(fileName) && await fileProvider.exists(fileName)) {
    return fileName;
  }
  if (baseName) {
    let dirName: PathLike = baseName;
    if (!isFolder) {
      dirName = fileProvider.dirname(baseName);
    }
    const absolute = fileProvider.joinPath(dirName, fileProvider.fsPath(fileName));
    if (await fileProvider.exists(absolute)) {
      return absolute;
    }
  }
  return undefined;
}

export function replaceInvalidChars(fileName: string): string {
  const result = fileName.replace(/[/\\?%*:|"<>]/gu, '_');
  return result.split('_').filter(obj => obj.length > 0).join('_');
}


export function shortenFileName(fileName: string, maxChars = 50): string {
  const result: Array<string> = [];

  let charLength = 0;
  for (const item of fileName.split('_').reverse()) {
    if (item.length + charLength < maxChars) {
      result.push(item);
      charLength += (item.length + 1);
    } else if (result.length === 0) {
      result.push(item);
    }
  }
  const joinedString = result.reverse().join('_');
  return joinedString.slice(Math.max(joinedString.length - maxChars, 0));
}


export async function findRootDirOfFile(filename: PathLike, workingDir?: PathLike, ...files: Array<string>): Promise<PathLike | undefined> {
  let file = filename;
  if (!fileProvider.isAbsolute(filename) && workingDir) {
    file = fileProvider.joinPath(workingDir, fileProvider.fsPath(filename));
  }
  return await findRootDir(fileProvider.dirname(file), ...files);
}

export async function findRootDir(currentDir: PathLike, ...files: Array<string>): Promise<PathLike | undefined> {
  const searchFiles = [
    'package.json',
    '.httpyac.json',
    '.httpyac.js',
    '.env',
    'http-client.env.json',
    'http-client.private.env.json',
  ];
  const dirFiles = await fileProvider.readdir(currentDir);

  if (dirFiles.some(file => searchFiles.indexOf(file) >= 0)) {
    return currentDir;
  }
  for (const file of files) {
    const dir = fileProvider.joinPath(currentDir, file);
    if (await fileProvider.exists(dir)) {
      return fileProvider.dirname(dir);
    }
  }
  if (fileProvider.dirname(currentDir) !== currentDir) {
    return findRootDir(fileProvider.dirname(currentDir), ...files);
  }
  return undefined;
}

export async function parseJson<T>(fileName: PathLike) : Promise<T | undefined> {
  try {
    const text = await fileProvider.readFile(fileName, 'utf-8');
    return JSON.parse(text);
  } catch (err) {
    log.trace(err);
  }
  return undefined;
}


export async function getHttpacJsonConfig(rootDir: PathLike) : Promise<EnvironmentConfig | undefined> {
  let result = await parseJson<EnvironmentConfig>(fileProvider.joinPath(rootDir, '.httpyac.json'));
  if (!result) {
    result = (await parseJson<Record<string, EnvironmentConfig>>(fileProvider.joinPath(rootDir, 'package.json')))?.httpyac;
  }
  if (result) {
    await resolveClientCertficates(result, rootDir);
  }
  return result;
}


export async function resolveClientCertficates(config: EnvironmentConfig, rootDir: PathLike) : Promise<void> {
  if (config.clientCertificates) {
    for (const [, value] of Object.entries(config.clientCertificates)) {
      if (value.cert) {
        value.cert = await toAbsoluteFilename(value.cert, rootDir, true) || value.cert;
      }
      if (value.key) {
        value.key = await toAbsoluteFilename(value.key, rootDir, true) || value.key;
      }
      if (value.pfx) {
        value.pfx = await toAbsoluteFilename(value.pfx, rootDir, true) || value.pfx;
      }
    }
  }
}
