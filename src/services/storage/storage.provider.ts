export interface UploadedFile {
    url: string;
    mimetype: string;
    filename: string;
    size: number;
}

export interface StorageProvider {
    save(buffer: Buffer, originalName: string, mimetype: string): Promise<UploadedFile>;
}
