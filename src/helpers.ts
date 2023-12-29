import { defaultHeaders, nowString } from './constants.ts';
import { Class, DirectoryInfo, FileInfo } from './types.ts';
import { getMimeType } from './utils.ts';

export const response = (req: Request, body?: BodyInit | null, init?: ResponseInit) => {
  const url = new URL(req.url);
  const responseInit = {
    ...(init || {}),
    headers: init?.headers ? { ...defaultHeaders, ...init.headers } : defaultHeaders,
  };

  console.debug(`[${nowString}] [${req.method}] ${url.pathname} ${init?.status ?? 200}`);
  return new Response(body, responseInit);
};

// deno-lint-ignore no-explicit-any
export const responseError = (req: Request, error: any, options?: { action?: string; errorMsg?: [Class<Error>, string][] }) => {
  let errorMsg = 'Unknown Error';
  if (error instanceof Error) errorMsg = error.message;
  for (const [errorClass, msg] of options?.errorMsg || []) {
    if (error instanceof errorClass) errorMsg = msg;
  }

  console.error(`${options?.action && `${options?.action} `}Error: `, error);
  return response(req, JSON.stringify(errorMsg), { status: 400 });
};

export const getDirectoryEntries = async (path: string, uriBase?: string) => {
  const entries: (FileInfo | DirectoryInfo)[] = [];
  for await (const entry of Deno.readDir(path)) {
    if (!(entry.isDirectory || entry.isFile) || entry.name === '寶') continue;

    try {
      const fileInfo = await Deno.stat(`${path}/${entry.name}`);
      const uri = `${uriBase}/${entry.name}`.replace(/^\//, '');
      entries.push(
        entry.isFile
          ? {
            is: 'file',
            name: entry.name,
            uri,
            url: '',
            type: getMimeType(`${path}/${entry.name}`),
            size: fileInfo.size,
            uploadedAt: fileInfo.mtime,
          }
          : {
            is: 'directory',
            name: entry.name,
            uri,
            url: '',
            size: fileInfo.size,
            uploadedAt: fileInfo.mtime,
          },
      );
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
      console.debug('getDirectoryEntries Not found: ', error);
    }
  }

  return entries;
};
