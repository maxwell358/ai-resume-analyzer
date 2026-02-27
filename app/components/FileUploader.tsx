import React, {useState,useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import {formatSize} from "~/lib/puter";

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void,
}

const FileUploader = ({onFileSelect}: FileUploaderProps) => {
    function MyDropzone() {
    }
    const [file, setFile] = useState<File | null>(null);
    const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0] || null;

    setFile(selectedFile);
    onFileSelect?.(selectedFile);
    }, [onFileSelect]);
    const maxFileSize = 20 * 1024 * 1024;
    const {getRootProps, getInputProps, isDragActive, acceptedFiles} = useDropzone({
            onDrop,
            multiple: false,
            accept: {'application/pdf' : ['.pdf']},
            maxSize: maxFileSize,
        })

    return (
        <div className="w-full gradient-border">
            <div {...getRootProps()}>
                <input {...getInputProps()} />
               <div className="space-y-4 cursor-pointer">
                   <img src="/images/pdf.png" alt="pdf" className="size-10 mx-auto" />
                   {file ? (
                       <div className="uploader-selected-file" onClick={(e) => e.stopPropagation()}>
                           <div className="flex items-center space-x-3">
                               <div>
                                   <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                       {file.name}
                                   </p>
                                   <p className="text-sm text-gray-500">
                                       {formatSize(file.size)}
                                   </p>
                                     </div>
                       </div >
                           <button
                               type="button" // prevent form submission
                               className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
                               onClick={(e) => {
                                   e.stopPropagation(); // Prevents the drag-drop zone from opening when clicking delete
                                   setFile(null);
                                   onFileSelect?.(null);
                               }}
                           >
                               <img src="/icons/cross.svg" alt="cross" className="w-4 h-4 relative z-10" />
                           </button>



                       </div>
                   ):(
                       <div>
                           <div className="mx-auto h-16 flex items-center justify-center mb-2">
                               <img src="/icons/info.svg" alt="upload" className="size-20" />
                           </div>
                           <p className="text-lg text-gray-500">
                               <span className="font-semibol">
                                   Click to upload

                               </span> or drap and drop
                           </p>
                       <p className="text-lg text-gray">PDF ({formatSize(maxFileSize)})</p>
                       </div>


                   )}
               </div>
            </div>

        </div>
    )
}
export default FileUploader;
