import { serveDir } from 'https://deno.land/std@0.208.0/http/file_server.ts';
import { defaultHeadersArray, port, sharedPath } from './constants.ts';
import { checkFile, deleteFile, getInfo, listDirectory, uploadFile } from './actions.ts';
import { response } from './helpers.ts';

const uploadRoute = new URLPattern({ pathname: '/upload' });
const resourceRoute = new URLPattern({ pathname: '/:fileURI(.+\\.[A-Za-z0-9]+)' });
const resourceInfoRoute = new URLPattern({ pathname: '/info/:fileURI(.+)' });
const directoryRoute = new URLPattern({ pathname: '/list/:directory(.+)?' });

const handler = async (req: Request): Promise<Response> => {
  console.debug(req);
  const matchUpload = uploadRoute.exec(req.url);
  const matchResource = resourceRoute.exec(req.url);
  const matchInfo = resourceInfoRoute.exec(req.url);
  const matchDirectory = directoryRoute.exec(req.url);
  console.debug(!!matchUpload, !!matchResource, !!matchDirectory, !!matchInfo);

  const pathname = decodeURI(new URL(req.url).pathname);

  if (pathname.includes('寶') && !pathname.includes('寶寶')) return response(req, 'Not Found', { status: 404 });

  switch (true) {
    case matchUpload && req.method === 'POST':
      return await uploadFile(req);
    case matchInfo && req.method === 'GET':
      return await getInfo(req, matchInfo);
    case matchDirectory && req.method === 'GET':
      return await listDirectory(req, matchDirectory);
    case matchResource && req.method === 'GET':
      return serveDir(req, { fsRoot: sharedPath, enableCors: true, headers: defaultHeadersArray, showDirListing: true });
    case matchResource && req.method === 'OPTIONS':
      return await checkFile(req, matchResource);
    case matchResource && req.method === 'DELETE':
      return await deleteFile(req, matchResource);
    default:
      return response(req, 'Not Found', { status: 404 });
  }
};

if (import.meta.main) {
  Deno.serve({ port }, handler);
}
