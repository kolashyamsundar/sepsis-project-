import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { extractMLFeaturesFromText, ML_FEATURE_LABELS } from "@/lib/mlFeatureMapping";

interface MedicalReportUploadProps {
  onDataExtracted: (data: Record<string, string>) => void;
}

export function MedicalReportUpload({ onDataExtracted }: MedicalReportUploadProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<Record<string, string> | null>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const text = await file.text();
      
      // Extract using ML feature keys only
      const extracted = extractMLFeaturesFromText(text);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setExtractedData(extracted);

      const extractedCount = Object.keys(extracted).length;

      if (extractedCount > 0) {
        onDataExtracted(extracted);
        toast({
          title: "Data Extracted",
          description: `Successfully extracted ${extractedCount} ML feature values from the report. You can edit them before submitting.`,
        });
      } else {
        toast({
          title: "No Data Found",
          description: "Could not extract ML feature values. Please enter data manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Processing Error",
        description: "Failed to process the file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles(acceptedFiles);
      processFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "image/*": [".jpg", ".jpeg", ".png"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const removeFile = () => {
    setFiles([]);
    setExtractedData(null);
    setUploadProgress(0);
  };

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-primary" />
        Medical Report Upload
      </h3>

      {files.length === 0 ? (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <input {...getInputProps()} />
          <Upload className={cn("h-12 w-12 mx-auto mb-4", isDragActive ? "text-primary" : "text-muted-foreground")} />
          <p className="font-medium mb-1">
            {isDragActive ? "Drop your file here" : "Drag & drop your medical report"}
          </p>
          <p className="text-sm text-muted-foreground">
            Supports PDF, TXT, CSV, JPG, PNG (max 10MB)
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Only ML-relevant values will be extracted. You can edit before submission.
          </p>
          <Button variant="outline" size="sm" className="mt-4">
            Browse Files
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{files[0].name}</p>
              <p className="text-xs text-muted-foreground">{(files[0].size / 1024).toFixed(1)} KB</p>
              {isProcessing && (
                <div className="mt-2">
                  <Progress value={uploadProgress} className="h-1" />
                  <p className="text-xs text-muted-foreground mt-1">Processing... {uploadProgress}%</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : extractedData && Object.keys(extractedData).length > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-warning" />
              )}
              <Button variant="ghost" size="icon" onClick={removeFile} disabled={isProcessing}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {extractedData && Object.keys(extractedData).length > 0 && (
            <div className="p-4 rounded-lg bg-success/10 border border-success/30">
              <h4 className="font-medium flex items-center gap-2 mb-2 text-success">
                <CheckCircle2 className="h-4 w-4" />
                Extracted ML Features ({Object.keys(extractedData).length} values)
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                These values will be pre-filled in the form. You can edit them before submitting.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                {Object.entries(extractedData).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono text-xs">{key}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
