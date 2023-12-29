import { mimetypes, sharedPath } from './constants.ts';
import { DirectoryInfo, DirectoryParams, FileInfo, ResourceParams } from './types.ts';
import { getDirectoryFiles, response, responseError } from './helpers.ts';
import { getMimeType } from './utils.ts';

const findCategory = (type: string) => Object.entries(mimetypes).find(([_, types]) => types.includes(type))?.[0];

export const uploadFile = async (req: Request) => {
  try {
    const formData = await req.formData();

    const validFiles: (readonly [File, string, string, boolean])[] = [];
    for (const [name, file] of formData.entries()) {
      if (typeof file === 'string') continue;
      if (name !== 'file' && !name.includes('.')) throw new Error('Field name should be "file" or a complete filename');

      const fileCategory = findCategory(file.type);
      if (!fileCategory) throw new Error(`Unsupported file mimetype: ${file.type}`);

      const filenameArray = (name === 'file' ? file.name : name).split('/');
      const filePrefixPath = filenameArray.slice(0, -1).join('/');
      const filename = filenameArray.at(-1);
      const writePath = `${sharedPath}${filePrefixPath && `/${filePrefixPath}`}`;
      const writeFilePath = `${writePath}/${filename}`;
      const fileURI = `${filePrefixPath && `${filePrefixPath}/`}${filename}`;

      let exists = false;
      try {
        exists = !!await Deno.stat(writeFilePath);
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      }

      await Deno.mkdir(writePath, { recursive: true });

      validFiles.push([file, writeFilePath, fileURI, exists]);
    }

    if (!validFiles.length) throw new Error('No valid files');

    const insertedFileURLs = [];
    for await (const [file, writeFilePath, fileURI, exists] of validFiles) {
      if (!exists) await Deno.writeFile(writeFilePath, file.stream(), { createNew: true });

      const fileURL = req.url.replace('upload', fileURI);
      insertedFileURLs.push(fileURL);
    }

    const responseBody = insertedFileURLs.length === 1 ? insertedFileURLs[0] : insertedFileURLs;

    return response(req, JSON.stringify(responseBody), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return responseError(req, error, { action: 'Upload' });
  }
};

export const listDirectory = async (req: Request, match: URLPatternResult) => {
  const { directory } = match.pathname.groups as DirectoryParams;

  try {
    let entries: (FileInfo | DirectoryInfo)[] = [];
    try {
      const path = `${sharedPath}/${decodeURI(directory)}`;
      const entry = await Deno.stat(path);

      if (entry.isDirectory) entries = await getDirectoryFiles(path, decodeURI(directory));
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
      console.debug('listDirectory Not found: ', error);
    }

    entries = entries.map((entry) => ({ ...entry, url: decodeURI(`${req.url.endsWith('/') ? req.url : `${req.url}/`}${entry.name}`) }));

    return response(req, JSON.stringify(entries));
  } catch (error) {
    return responseError(req, error, { action: 'ListDirectory' });
  }
};

export const getInfo = async (req: Request, match: URLPatternResult) => {
  const { fileURI } = match.pathname.groups as ResourceParams;

  try {
    const fileInfo = await Deno.stat(`${sharedPath}/${decodeURI(fileURI)}`);
    console.debug('Get Info: ', fileInfo);

    return response(req, JSON.stringify({ ...fileInfo, type: getMimeType(`${sharedPath}/${decodeURI(fileURI)}`) }));
  } catch (error) {
    return responseError(req, error, { action: 'Check' });
  }
};

export const checkFile = async (req: Request, match: URLPatternResult) => {
  const { fileURI } = match.pathname.groups as ResourceParams;

  try {
    const fileInfo = await Deno.stat(`${sharedPath}/${decodeURI(fileURI)}`);
    console.debug('Checked: ', fileInfo);

    return response(req);
  } catch (error) {
    return responseError(req, error, { action: 'Check' });
  }
};

export const deleteFile = async (req: Request, match: URLPatternResult) => {
  const { fileURI } = match.pathname.groups as ResourceParams;

  try {
    await Deno.remove(`${sharedPath}/${decodeURI(fileURI)}`);

    return response(req, JSON.stringify('Success'));
  } catch (error) {
    return responseError(req, error, {
      action: 'Delete',
      errorMsg: [[Deno.errors.NotFound, 'File not found']],
    });
  }
};
