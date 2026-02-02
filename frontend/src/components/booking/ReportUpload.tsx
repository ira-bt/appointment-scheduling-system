import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { appointmentService } from '@/src/services/appointment.service';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/src/utils/api-error';

interface ReportUploadProps {
    appointmentId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const ReportUpload: React.FC<ReportUploadProps> = ({ appointmentId, onSuccess, onCancel }) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);

            // Basic validation
            const validFiles = filesArray.filter(file => {
                const isValidType = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type);
                const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

                if (!isValidType) toast.error(`${file.name} is not a supported format (JPG, PNG, PDF only)`);
                if (!isValidSize) toast.error(`${file.name} exceeds 5MB limit`);

                return isValidType && isValidSize;
            });

            setSelectedFiles(prev => {
                const combined = [...prev, ...validFiles];
                return combined.slice(0, 5); // Limit to 5 files
            });
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setIsUploading(true);
        try {
            await appointmentService.uploadReports(appointmentId, selectedFiles);
            toast.success('Reports uploaded successfully');
            setSelectedFiles([]);
            if (onSuccess) onSuccess();
        } catch (error: unknown) {
            const errorMessage = getErrorMessage(error);
            console.error('Upload failed:', errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Upload className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Upload Medical Reports</h3>
                    <p className="text-sm text-slate-500 italic">Optional: Upload scans, prescriptions, or previous reports (Max 5 files, 5MB each)</p>
                </div>
            </div>

            <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-300 hover:bg-slate-50 transition-all group"
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                />
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-400 mt-1">Supported: JPG, PNG, PDF</p>
                </div>
            </div>

            {selectedFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Selected Files ({selectedFiles.length}/5)</p>
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group animate-in fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                className="p-1 hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors rounded"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8 flex items-center justify-end gap-3">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        disabled={isUploading}
                        className="btn btn-ghost"
                    >
                        Skip for now
                    </button>
                )}
                <button
                    onClick={handleUpload}
                    disabled={selectedFiles.length === 0 || isUploading}
                    className="btn btn-primary gap-2 min-w-[160px]"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            Upload & Continue
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
