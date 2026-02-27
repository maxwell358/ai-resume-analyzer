import { type FormEvent, useState } from "react";
import FileUploader from "~/components/FileUploader";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/hooks/usePuterStore";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/puter";
import { prepareInstructions } from "../../constants";

const Upload = () => {
    const { fs, ai, kv, auth } = usePuterStore();
    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = (selectedFile: File | null) => {
        setError(null);
        if (selectedFile) {
            const isPDF = selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf");
            if (!isPDF) {
                setError("Please upload a PDF file only.");
                setFile(null);
                return;
            }
            const sizeInMB = selectedFile.size / (1024 * 1024);
            if (sizeInMB > 25) {
                setError(`File is too large (${sizeInMB.toFixed(1)}MB). Max 25MB.`);
                setFile(null);
                return;
            }
        }
        setFile(selectedFile);
    };

    const handleRemoveFile = () => {
        setFile(null);
        setError(null);
    };
    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File }) => {
        // 1. Verify all services are available from the hook
        if (!fs || !ai || !kv || !auth) {
            alert("Puter services are still loading. Please wait a moment.");
            return;
        }

        // 2. Auth Check: Puter Cloud features (FS/KV) require a signed-in user
        const signedIn = await auth.isSignedIn();
        if (!signedIn) {
            navigate("/auth?redirectTo=/upload");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // 3. Upload PDF: Puter's fs.upload returns an array if you pass [file]
            setStatusText("Uploading original resume to cloud...");
            const uploadResult = await fs.upload([file]);

            // Extract the first FSItem from the array
            const uploadedFile = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;

            if (!uploadedFile?.path) {
                throw new Error("Upload failed: Could not retrieve file path from Puter.");
            }

            // 4. Create unique ID and Storage Key
            const uuid = generateUUID();
            const storageKey = `resume:${uuid}`;

            // 5. Optional Image Conversion (Wrap in try/catch so it doesn't break the flow)
            let imagePath = "";
            try {
                setStatusText("Generating preview image...");
                const imageFileResult = await convertPdfToImage(file);
                if (imageFileResult?.file) {
                    const imageUploadResult = await fs.upload([imageFileResult.file]);
                    const uploadImage = Array.isArray(imageUploadResult) ? imageUploadResult[0] : imageUploadResult;
                    imagePath = uploadImage?.path || "";
                }
            } catch (convError) {
                console.warn("Image conversion failed, proceeding without preview:", convError);
            }

            // 6. AI Analysis: Pass instructions and the cloud file path
            setStatusText("Analyzing resume with AI...");
            const instructions = prepareInstructions({ jobTitle, jobDescription });

            const response = await ai.chat([
                {
                    role: "user",
                    content: [
                        { type: "text", text: `${instructions}\n\nPlease analyze the resume found at: ${uploadedFile.path}` },
                        { type: "file", puter_path: uploadedFile.path }
                    ]
                }
            ]);

            if (!response) throw new Error("AI returned an empty response.");

            // Safe extraction of the feedback text
            const feedbackText = typeof response === 'string'
                ? response
                : response?.message?.content || "Analysis complete with no specific text.";

            // 7. Save Final Data to KV Store
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: imagePath,
                companyName,
                jobTitle,
                jobDescription,
                feedback: feedbackText,
            };

            // Puter KV accepts objects directly, but stringifying is safer for complex structures
            await kv.set(storageKey, JSON.stringify(data));

            console.log("Analysis success for UUID:", uuid);

            // Small delay to ensure KV propagation before redirect
            setTimeout(() => {
                navigate(`/results/${uuid}`);
            }, 300);

        } catch (err: any) {
            console.error("ANALYSIS ERROR:", err);
            setError(err?.message || "An unexpected error occurred during analysis.");
            setStatusText("Error.");
        } finally {
            setIsProcessing(false);
        }
    };


    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const companyName = formData.get("company-name") as string;
        const jobTitle = formData.get("job-title") as string;
        const jobDescription = formData.get("job-description") as string;

        if (!file) {
            setError("Please select a file first.");
            return;
        }

        await handleAnalyze({ companyName, jobTitle, jobDescription, file });
    };

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
            <section className="main-section p-8">
                <div className="page-heading text-center">
                    <h1 className="text-3xl font-bold">Smart feedback for your dream job</h1>

                    {isProcessing ? (
                        <div className="mt-10">
                            <h2 className="text-xl text-blue-600 mb-4 font-semibold">{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full max-w-md mx-auto rounded-xl shadow-lg" alt="Analyzing" />
                        </div>
                    ) : (
                        <div className="max-w-xl mx-auto mt-10">
                            <h2 className="mb-6 text-gray-700 font-medium">Drop your resume for an ATS score and improvement tips</h2>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                                <input type="text" name="job-title" placeholder="Job Title" required className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                <input type="text" name="company-name" placeholder="Company Name" required className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                <textarea name="job-description" placeholder="Job Description" rows={4} required className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />

                                <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center bg-gray-50/50">
                                    <FileUploader onFileSelect={handleFileSelect} />

                                    {error && (
                                        <p className="text-red-500 text-sm font-bold mt-2 bg-red-50 p-2 rounded border border-red-100">
                                            {error}
                                        </p>
                                    )}

                                    {file && (
                                        <div className="mt-2 flex items-center justify-center gap-3 bg-green-50 p-2 rounded-lg border border-green-200">
                                            <p className="text-green-600 text-sm font-bold truncate max-w-[200px]">
                                                {file.name}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded border border-red-200 bg-white shadow-sm transition-all"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all active:scale-[0.98] shadow-md mt-4">
                                    Analyze Resume
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
};

export default Upload;
