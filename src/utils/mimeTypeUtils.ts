import { ContentType } from '../httpRegion';

export function parseMimeType(contentType: string): ContentType {
  const [mimeType, ...parameters] = contentType.split(';').map(v => v.trim());
  const charset = parameters.find(p => p.startsWith('charset='))?.split('=')[1];
  return { mimeType, charset };
}

export function isMimeTypeJSON(contentType: ContentType | undefined) {
  return contentType && (
    contentType.mimeType === 'application/json'
    || contentType.mimeType.indexOf('+json') >= 0
  );
}
export function isMimeTypeJavascript(contentType: ContentType | undefined) {
  return contentType?.mimeType === 'application/javascript';
}
export function isMimeTypeXml(contentType: ContentType | undefined) {
  return contentType && (
    contentType.mimeType === 'application/xml'
    || contentType.mimeType === 'text/xml'
    || contentType.mimeType.indexOf('+xml') >= 0
  );
}
export function isMimeTypeHtml(contentType: ContentType | undefined) {
  return contentType?.mimeType === 'text/html';

}
export function isMimeTypeCSS(contentType: ContentType | undefined) {
  return contentType?.mimeType === 'text/css';
}

export function isMimeTypeMultiPartFormData(contentType: ContentType | undefined): boolean {
  return contentType?.mimeType === 'multipart/form-data';
}

export function isMimeTypeNewlineDelimitedJSON(contentType: ContentType | undefined): boolean {
  return contentType?.mimeType === 'application/x-ndjson';
}

export function isMimeTypeFormUrlEncoded(contentType: ContentType | undefined): boolean {
  return contentType?.mimeType === 'application/x-www-form-urlencoded';
}
