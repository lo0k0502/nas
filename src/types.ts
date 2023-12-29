// deno-lint-ignore no-explicit-any
export type Class<T, S extends any[] = []> = { new (...args: S): T };

export interface FileInfo {
  is: 'file';
  name: string;
  uri: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date | null;
}

export interface DirectoryInfo {
  is: 'directory';
  name: string;
  uri: string;
  url: string;
  size: number;
  uploadedAt: Date | null;
}

export type ResourceParams = {
  uri: string;
};

export type DirectoryParams = {
  directory: string;
};
