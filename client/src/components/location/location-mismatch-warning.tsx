import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "@/hooks/use-translation";

interface LocationMismatchWarningProps {
  type: 'gps-when-list-required' | 'list-when-gps-required';
  onDismiss?: () => void;
}

export function LocationMismatchWarning({ type, onDismiss }: LocationMismatchWarningProps) {
  const { t, locale } = useTranslation();
  let title = '';
  let description = '';
  
  if (type === 'gps-when-list-required') {
    title = t("Location Format Mismatch");
    description = t("You've set your location using GPS coordinates, but this feature requires using the predefined location list. Please update your location using the dropdown menus to continue.");
  } else if (type === 'list-when-gps-required') {
    title = t("Location Format Mismatch");
    description = t("You've set your location using the predefined list, but this feature requires GPS coordinates. Please use the 'Detect Using GPS' option to update your location.");
  }
  
  return (
    <Alert className="mb-4 border-amber-500 bg-amber-50 text-amber-800">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}