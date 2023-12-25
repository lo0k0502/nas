export const port = parseInt(Deno.args[Deno.args.indexOf('-p') + 1]) || 80;
export const defaultHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
};
export const defaultHeadersArray = ['Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE'];

export const sharedPath = 'shared';

export const mimetypes = {
  pdf: ['application/pdf'],
  font: ['font/collection', 'font/otf', 'font/sfnt', 'font/ttf', 'font/woff', 'font/woff2'],
  image: ['image/avif', 'image/bmp', 'image/gif', 'image/vnd.microsoft.icon', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/tiff', 'image/webp'],
  video: ['video/x-msvideo', 'video/mp4', 'video/mpeg', 'video/ogg', 'video/mp2t', 'video/webm', 'video/3gpp', 'video/3gpp2', 'video/quicktime'],
  text: ['text/plain'],
};

export const nowString = new Date().toISOString().replace(/T|\.\d{3}Z/g, ' ').trimEnd();
