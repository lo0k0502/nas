import mime from 'npm:mime@4.0.1';

export const getMimeType = (filePath: string) => mime.getType(filePath)!;
