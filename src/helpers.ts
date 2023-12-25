import { defaultHeaders, nowString } from './constants.ts';
import { Class, FileInfo } from './types.ts';
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

export const getFiles = async (dirPath: string) => {
  const files: FileInfo[] = [];

  for await (const file of Deno.readDir(dirPath)) {
    if (file.isDirectory) files.push(...(await getFiles(`${dirPath}/${file.name}`)));
    else if (file.isFile && !file.name.startsWith('.')) {
      const fileInfo = await Deno.stat(`${dirPath}/${file.name}`);
      const uri = `${dirPath}/${file.name}`.split('/').slice(2).join('/');
      files.push({
        name: file.name,
        uri,
        url: '',
        type: getMimeType(`${dirPath}/${file.name}`),
        size: fileInfo.size,
        uploadedAt: fileInfo.mtime,
      });
    }
  }

  return files;
};
