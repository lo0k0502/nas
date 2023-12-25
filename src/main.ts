import { serveDir } from 'https://deno.land/std@0.208.0/http/file_server.ts';
import { defaultHeadersArray, port, sharedPath } from './constants.ts';
import { checkFile, deleteFile, listFiles, uploadFile } from './actions.ts';
import { response } from './helpers.ts';

const uploadRoute = new URLPattern({ pathname: '/resources/:hospital/upload' });
const resourceRoute = new URLPattern({ pathname: '/resources/:hospital/:type/:fileURI*' });
const allResourceRoute = new URLPattern({ pathname: '/resources/:hospital' });

const handler = async (req: Request): Promise<Response> => {
  console.debug(req);
  const matchUpload = uploadRoute.exec(req.url);
  const matchResource = resourceRoute.exec(req.url);
  const matchAllResource = allResourceRoute.exec(req.url);

  switch (true) {
    case matchUpload && req.method === 'POST':
      return await uploadFile(req, matchUpload);
    case matchResource && req.method === 'GET':
      return serveDir(req, { fsRoot: sharedPath, urlRoot: 'resources', enableCors: true, headers: defaultHeadersArray, showDirListing: true });
    case matchAllResource && req.method === 'GET':
      return await listFiles(req, matchAllResource);
    case matchResource && req.method === 'OPTIONS':
      return await checkFile(req, matchResource);
    case matchResource && req.method === 'DELETE':
      return await deleteFile(req, matchResource);
    default:
      return response(req, 'Not Found', { status: 404 });
  }
};

if (import.meta.main) {
  console.debug(`\x1b[1m\x1b[32mAssets CDN Version: \x1b[33m${(await import('../deno.json', { with: { type: 'json' } })).default.version}\x1b[0m`);
  Deno.serve({ port }, handler);
}
