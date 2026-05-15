import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface FormValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
}

export function FormValidationDialog({
  isOpen,
  onClose,
  missingFields,
}: FormValidationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-warning">
            <AlertCircle className="h-5 w-5" />
            Missing Required Fields
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Please fill in the following required fields before submitting:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <ul className="space-y-2">
            {missingFields.map((field, index) => (
              <li
                key={index}
                className="flex items-center gap-2 p-2 rounded bg-warning/10 border border-warning/30 text-sm"
              >
                <span className="h-2 w-2 rounded-full bg-warning" />
                <span className="capitalize">{field.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground ml-auto">— Please fill this field</span>
              </li>
            ))}
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>
            Understood
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
