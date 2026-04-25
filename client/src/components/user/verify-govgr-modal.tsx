import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
    FileUp,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Loader2,
    FileCheck,
    AlertTriangle,
    Shield,
    ArrowRight
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface VerifyGovgrModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = "intro" | "upload" | "result";

interface ValidationResult {
    success: boolean;
    message: string;
    rejection_reason?: string;
    signer_name?: string;
}

export function VerifyGovgrModal({ isOpen, onClose }: VerifyGovgrModalProps) {
  const { t, locale } = useTranslation();
    const [step, setStep] = useState<Step>("intro");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

    const { toast } = useToast();
    const { user } = useAuth();

    const getRejectionLabel = (reason: string) => {
        const reasons: Record<string, string> = {
            "invalid_signature": "Μη έγκυρη ψηφιακή υπογραφή",
            "unknown_signer": "Η υπογραφή δεν είναι από αναγνωρισμένη αρχή Gov.gr",
            "no_signature": "Το έγγραφο δεν περιέχει ψηφιακή υπογραφή",
            "duplicate_file": "Το συγκεκριμένο αρχείο έχει ήδη χρησιμοποιηθεί",
            "invalid_token": "Άκυρο αναγνωριστικό (token)",
            "token_not_found": "Δεν βρέθηκε το αναγνωριστικό ψηφοφορίας",
            "afm_not_found": "Δεν εντοπίστηκε ΑΦΜ στο έγγραφο",
            "already_voted": "Έχετε ήδη ψηφίσει",
            "vote_choice_not_found": "Δεν βρέθηκε ξεκάθαρη επιλογή ψήφου",
            "pdf_read_error": "Σφάλμα ανάγνωσης του αρχείου PDF"
        };
        return reasons[reason] || reason;
    };

    // Verify identity mutation
    const verifyMutation = useMutation({
        mutationFn: async () => {
            if (!selectedFile) {
                throw new Error("Παρακαλώ επιλέξτε ένα αρχείο PDF");
            }

            const formData = new FormData();
            formData.append("file", selectedFile);

            const response = await fetch("/api/user/verify-govgr", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.detail) {
                    return typeof result.detail === 'object' ? result.detail : { success: false, message: result.detail };
                }
                return { success: false, message: result.message || "Η επαλήθευση απέτυχε", rejection_reason: result.rejection_reason };
            }

            return result as ValidationResult;
        },
        onSuccess: (result) => {
            setValidationResult(result);
            setStep("result");

            if (result.success) {
                queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                toast({
                    title: "Επιτυχία",
                    description: "Η ταυτότητα επαληθεύτηκε επιτυχώς",
                });
            }
        },
        onError: (error: any) => {
            setValidationResult({
                success: false,
                message: error.message || "Παρουσιάστηκε σφάλμα κατά την επαλήθευση"
            });
            setStep("result");
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== "application/pdf") {
                toast({
                    title: "Σφάλμα",
                    description: "Παρακαλώ επιλέξτε ένα αρχείο PDF",
                    variant: "destructive",
                });
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast({
                    title: "Σφάλμα",
                    description: "Το μέγεθος του αρχείου πρέπει να είναι μικρότερο από 10MB",
                    variant: "destructive",
                });
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleSubmit = () => {
        verifyMutation.mutate();
    };

    const handleClose = () => {
        if (validationResult?.success) {
            // If success, just close
        }
        setStep("intro");
        setSelectedFile(null);
        setValidationResult(null);
        onClose();
    };

    const handleStartOver = () => {
        setStep("intro");
        setSelectedFile(null);
        setValidationResult(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        Επαλήθευση Ταυτότητας Gov.gr
                    </DialogTitle>
                    <DialogDescription>
                        Επαληθεύστε τον λογαριασμό σας χρησιμοποιώντας Υπεύθυνη Δήλωση Gov.gr για να ψηφίζετε σε ασφαλείς ψηφοφορίες.
                    </DialogDescription>
                </DialogHeader>

                {step === "intro" && (
                    <div className="space-y-4">
                        <Alert className="bg-blue-50 border-blue-200">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-800">Εφάπαξ Επαλήθευση</AlertTitle>
                            <AlertDescription className="text-blue-700">
                                Μόλις επαληθευτείτε, μπορείτε να ψηφίσετε σε οποιαδήποτε πιστοποιημένη ψηφοφορία χωρίς να ανεβάζετε έγγραφα ξανά. Η ταυτότητά σας επαληθεύεται με ασφάλεια μέσω του ΑΦΜ.
                            </AlertDescription>
                        </Alert>

                        <Card>
                            <CardContent className="p-4 space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                                    Δημιουργία Υπεύθυνης Δήλωσης
                                </h4>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between"
                                    onClick={() => window.open("https://docs.gov.gr", "_blank")}
                                >
                                    <span>Μετάβαση στο Gov.gr</span>
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                    Δημιουργήστε μια απλή δήλωση με κείμενο: <strong>"Βεβαιώνω την ταυτότητά μου για επαλήθευση στο AgoraX."</strong>
                                </p>

                                <Separator />

                                <h4 className="font-semibold flex items-center gap-2">
                                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                                    Ανεβάστε το υπογεγραμμένο PDF
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Κατεβάστε το υπογεγραμμένο PDF από το Gov.gr και ανεβάστε το στο επόμενο βήμα.
                                </p>
                            </CardContent>
                        </Card>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>
                                Ακύρωση
                            </Button>
                            <Button onClick={() => setStep("upload")} className="flex items-center gap-2">
                                Έναρξη Επαλήθευσης
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === "upload" && (
                    <div className="space-y-4">
                        <Alert className="bg-green-50 border-green-200">
                            <FileCheck className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Ανέβασμα Εγγράφου</AlertTitle>
                            <AlertDescription className="text-green-700">
                                Επιλέξτε το PDF της Υπεύθυνης Δήλωσης.
                            </AlertDescription>
                        </Alert>

                        <Card>
                            <CardContent className="p-6">
                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                                    <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <Label htmlFor="verification-file" className="cursor-pointer">
                                        <div className="space-y-2">
                                            <p className="font-medium">Κλικ για επιλογή PDF</p>
                                            <p className="text-sm text-muted-foreground">ή σύρετε το αρχείο εδώ</p>
                                        </div>
                                    </Label>
                                    <Input
                                        id="verification-file"
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    {selectedFile && (
                                        <div className="mt-4 p-3 bg-muted rounded-md flex items-center gap-2">
                                            <FileCheck className="h-5 w-5 text-green-600" />
                                            <span className="text-sm font-medium">{selectedFile.name}</span>
                                            <span className="text-xs text-muted-foreground">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <DialogFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep("intro")}>
                                Πίσω
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!selectedFile || verifyMutation.isPending}
                                className="flex items-center gap-2"
                            >
                                {verifyMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Επαλήθευση...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="h-4 w-4" />
                                        Επαλήθευση Ταυτότητας
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === "result" && validationResult && (
                    <div className="space-y-4">
                        {validationResult.success ? (
                            <>
                                <div className="text-center py-6">
                                    <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
                                    <h3 className="text-xl font-semibold text-green-800 mb-2">Επιτυχής Επαλήθευση!</h3>
                                    <p className="text-muted-foreground">Ο λογαριασμός σας πιστοποιήθηκε μέσω Gov.gr.</p>
                                </div>
                                <Card className="bg-green-50 border-green-200">
                                    <CardContent className="p-4">
                                        {validationResult.signer_name && (
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium">Όνομα στο Gov.gr:</span>
                                                <span className="text-sm">{validationResult.signer_name}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <>
                                <div className="text-center py-6">
                                    <XCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
                                    <h3 className="text-xl font-semibold text-red-800 mb-2">Η Επαλήθευση Απέτυχε</h3>
                                    <p className="text-muted-foreground">{validationResult.message}</p>
                                </div>
                                {validationResult.rejection_reason && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Αιτία Απόρριψης</AlertTitle>
                                        <AlertDescription>
                                            {getRejectionLabel(validationResult.rejection_reason)}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </>
                        )}
                        <DialogFooter className="flex justify-between">
                            {!validationResult.success && (
                                <Button variant="outline" onClick={handleStartOver}>
                                    Προσπάθεια Ξανά
                                </Button>
                            )}
                            <Button onClick={handleClose}>Κλείσιμο</Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
