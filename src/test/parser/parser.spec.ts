import { parseHttp, initFileProvider } from '../testUtils';

describe('parser', () => {
  initFileProvider();
  it('should parse 3 httpregion', async () => {
    const httpFile = await parseHttp(`
    GET https://httpbin.org/anything
    GET https://httpbin.org/anything
    GET https://httpbin.org/anything
    `);
    expect(await httpFile.fileName).toBe('any.http');
    expect(await httpFile.httpRegions.length).toBe(3);
    for (const httpRegion of httpFile.httpRegions) {
      expect(httpRegion.request).toBeDefined();
      expect(httpRegion.request?.method).toBe('GET');
      expect(httpRegion.request?.url).toBe('https://httpbin.org/anything');

      expect(httpRegion.symbol.source?.trim()).toBe('GET https://httpbin.org/anything');
    }
  });
  it('should support header spread', async () => {
    const httpFile = await parseHttp(`
    {{+
      const token = "test"
      exports.defaultHeaders = {
        'Content-Type': 'text/html',
        'Authorization': \`Bearer \${token}\`
      };
    }}
    ###
    GET https://httpbin.org/anything
    ...defaultHeaders
    GET https://httpbin.org/anything
    ...defaultHeaders
    `);
    expect(await httpFile.fileName).toBe('any.http');
    expect(await httpFile.httpRegions.length).toBe(3);

    const globalRegion = httpFile.httpRegions.shift();
    expect(globalRegion?.request).toBeUndefined();

    for (const httpRegion of httpFile.httpRegions) {
      expect(httpRegion.request).toBeDefined();
      expect(httpRegion.request?.method).toBe('GET');
      expect(httpRegion.request?.method).toBe('GET');
      expect(httpRegion.request?.url).toBe('https://httpbin.org/anything');

      expect(httpRegion.symbol.source?.trim()).toBe(`GET https://httpbin.org/anything\n    ...defaultHeaders`);
    }
  });
});
