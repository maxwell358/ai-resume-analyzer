import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "~/lib/puter";

interface FileUploaderProps {
    file: File | null;
    maxFileSize: number;
    onFileSelect: (file: File | null) => void;
    onError?: (message: string | null) => void;
}

const FileUploader = ({ file, maxFileSize, onFileSelect, onError }: FileUploaderProps) => {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const selectedFile = acceptedFiles[0] || null;
            onError?.(null);
            onFileSelect(selectedFile);
        },
        [onError, onFileSelect],
    );

    const onDropRejected = useCallback(
        () => {
            onError?.(`Only PDF files up to ${formatSize(maxFileSize)} are supported.`);
            onFileSelect(null);
        },
        [maxFileSize, onError, onFileSelect],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        onDropRejected,
        multiple: false,
        accept: { "application/pdf": [".pdf"] },
        maxSize: maxFileSize,
    });

    return (
        <div className="w-full gradient-border">
            <div {...getRootProps()}>
                <input {...getInputProps()} />
                <div className="space-y-4 cursor-pointer">
                    <img src="/images/pdf.png" alt="PDF file icon" className="size-10 mx-auto" />
                    {file ? (
                        <div className="uploader-selected-file" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center space-x-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 truncate max-w-xs">{file.name}</p>
                                    <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFileSelect(null);
                                }}
                            >
                                <img src="/icons/cross.svg" alt="Remove selected file" className="w-4 h-4 relative z-10" />
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="mx-auto h-16 flex items-center justify-center mb-2">
                                <img src="/icons/info.svg" alt="Upload information" className="size-20" />
                            </div>
                            <p className="text-lg text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-lg text-gray-500">PDF (max {formatSize(maxFileSize)})</p>
                            {isDragActive && <p className="text-sm text-blue-600 mt-2">Drop your PDF to upload it.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileUploader;
