// deno-lint-ignore no-explicit-any
export type Class<T, S extends any[] = []> = { new (...args: S): T };

export interface FileInfo {
  name: string;
  uri: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date | null;
}

export type UploadParams = {
  hospital: string;
};

export type ResourceParams = {
  hospital: string;
  type: string;
  fileURI: string;
};

export type AllResourceParams = {
  hospital: string;
};
