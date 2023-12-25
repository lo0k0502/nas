import { mimetypes, sharedPath } from './constants.ts';
import { AllResourceParams, FileInfo, ResourceParams, UploadParams } from './types.ts';
import { getFiles, response, responseError } from './helpers.ts';

const findCategory = (type: string) => Object.entries(mimetypes).find(([_, types]) => types.includes(type))?.[0];

export const uploadFile = async (req: Request, match: URLPatternResult) => {
  const { hospital } = match.pathname.groups as UploadParams;

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
      const writePath = `${sharedPath}/${hospital}/${fileCategory}${filePrefixPath && `/${filePrefixPath}`}`;
      const writeFilePath = `${writePath}/${filename}`;
      const fileURI = `${fileCategory}${filePrefixPath && `/${filePrefixPath}`}/${filename}`;

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

export const listFiles = async (req: Request, match: URLPatternResult) => {
  const { hospital } = match.pathname.groups as AllResourceParams;

  try {
    let files: FileInfo[] = [];
    try {
      const entry = await Deno.stat(`${sharedPath}/${hospital}`);
      if (entry.isDirectory) files = await getFiles(`${sharedPath}/${hospital}`);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }

    files = files.map((file) => ({ ...file, url: `${req.url}/${file.uri}` }));

    return response(req, JSON.stringify(files));
  } catch (error) {
    return responseError(req, error, { action: 'List' });
  }
};

export const checkFile = async (req: Request, match: URLPatternResult) => {
  const { hospital, type, fileURI } = match.pathname.groups as ResourceParams;

  try {
    if (!Object.keys(mimetypes).includes(type)) throw new Error('Unknown file category');

    const fileInfo = await Deno.stat(`${sharedPath}/${hospital}/${type}/${decodeURI(fileURI)}`);
    console.debug('Checked: ', fileInfo);

    return response(req);
  } catch (error) {
    return responseError(req, error, { action: 'Check' });
  }
};

export const deleteFile = async (req: Request, match: URLPatternResult) => {
  const { hospital, type, fileURI } = match.pathname.groups as ResourceParams;

  try {
    if (!Object.keys(mimetypes).includes(type)) throw new Error('Unknown file category');

    await Deno.remove(`${sharedPath}/${hospital}/${type}/${decodeURI(fileURI)}`);

    return response(req, JSON.stringify('Success'));
  } catch (error) {
    return responseError(req, error, {
      action: 'Delete',
      errorMsg: [[Deno.errors.NotFound, 'File not found']],
    });
  }
};
