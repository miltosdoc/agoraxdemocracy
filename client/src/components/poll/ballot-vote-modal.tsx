import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PollWithOptions } from "@shared/schema";
import {
    FileUp,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Copy,
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

interface BallotVoteModalProps {
    poll: PollWithOptions;
    isOpen: boolean;
    onClose: () => void;
    onVoteSubmit?: () => void;
}

type Step = "instructions" | "upload" | "result";

interface BallotToken {
    poll_id: string;
    poll_token: string;
    expires_at: string;
}

interface BallotInstructions {
    link: string;
    template_text: string;
    poll_token: string;
}

interface ValidationResult {
    success: boolean;
    message: string;
    rejection_reason?: string;
    vote_choice?: string;
    signer_name?: string;
}

export function BallotVoteModal({ poll, isOpen, onClose, onVoteSubmit }: BallotVoteModalProps) {
  const { t, locale } = useTranslation();
    const [step, setStep] = useState<Step>("instructions");
    const [token, setToken] = useState<BallotToken | null>(null);
    const [instructions, setInstructions] = useState<BallotInstructions | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [copied, setCopied] = useState(false);

    const { toast } = useToast();
    const { user } = useAuth();

    // Generate token mutation
    const tokenMutation = useMutation({
        mutationFn: async (): Promise<BallotToken> => {
            const response = await apiRequest("POST", "/api/ballot/token", {
                pollId: poll.id.toString()
            });
            const data = await response.json();
            return data as BallotToken;
        },
        onSuccess: async (tokenData) => {
            setToken(tokenData);
            // Fetch instructions with the token
            const instructionsResponse = await fetch(
                `/api/ballot/instructions?pollId=${poll.id}&pollToken=${tokenData.poll_token}`,
                { credentials: 'include' }
            );
            if (instructionsResponse.ok) {
                const instructionsData = await instructionsResponse.json();
                setInstructions(instructionsData);
            }
        },
        onError: (error: any) => {
            toast({
                title: t('general.error'),
                description: error.message || t("Failed to generate voting token"),
                variant: "destructive",
            });
        }
    });

    // Validate ballot mutation
    const validateMutation = useMutation({
        mutationFn: async () => {
            if (!selectedFile || !token) {
                throw new Error(t("Please select a PDF file"));
            }

            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("pollId", poll.id.toString());
            formData.append("pollToken", token.poll_token);

            const response = await fetch("/api/ballot/validate", {
                method: "POST",
                body: formData,
                credentials: 'include'
            });

            const result = await response.json();

            if (!response.ok) {
                // Handle different error formats
                if (result.detail) {
                    return typeof result.detail === 'object' ? result.detail : { success: false, message: result.detail };
                }
                return { success: false, message: result.message || "Validation failed", rejection_reason: result.rejection_reason };
            }

            return result as ValidationResult;
        },
        onSuccess: (result) => {
            setValidationResult(result);
            setStep("result");

            if (result.success) {
                queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
                queryClient.invalidateQueries({ queryKey: [`/api/polls/${poll.id}`] });
            }
        },
        onError: (error: any) => {
            setValidationResult({
                success: false,
                message: error.message || t("An error occurred during validation")
            });
            setStep("result");
        }
    });

    // Initialize token when modal opens
    const handleOpen = useCallback(() => {
        if (!token && !tokenMutation.isPending) {
            tokenMutation.mutate();
        }
    }, [token, tokenMutation]);

    // Copy template text to clipboard
    const handleCopyTemplate = async () => {
        if (instructions?.template_text) {
            await navigator.clipboard.writeText(instructions.template_text);
            setCopied(true);
            toast({
                title: t("Copied!"),
                description: t("Template text copied to clipboard"),
            });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== "application/pdf") {
                toast({
                    title: t('general.error'),
                    description: t("Please select a PDF file"),
                    variant: "destructive",
                });
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast({
                    title: t('general.error'),
                    description: t("File size must be less than 10MB"),
                    variant: "destructive",
                });
                return;
            }
            setSelectedFile(file);
        }
    };

    // Submit ballot for validation
    const handleSubmit = () => {
        validateMutation.mutate();
    };

    // Close and reset
    const handleClose = () => {
        if (validationResult?.success && onVoteSubmit) {
            onVoteSubmit();
        }
        setStep("instructions");
        setSelectedFile(null);
        setValidationResult(null);
        onClose();
    };

    // Start over
    const handleStartOver = () => {
        setStep("instructions");
        setSelectedFile(null);
        setValidationResult(null);
        tokenMutation.mutate(); // Get a new token
    };

    if (!user) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{t("Login Required")}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>{t("Authentication Required")}</AlertTitle>
                            <AlertDescription>
                                {t("You need to be logged in to vote with Gov.gr verification.")}
                            </AlertDescription>
                        </Alert>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>
                            {t('general.close')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    // Call handleOpen when dialog opens
    useEffect(() => {
        if (isOpen && !token && !tokenMutation.isPending) {
            handleOpen();
        }
    }, [isOpen, token, tokenMutation.isPending, handleOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        {t("Gov.gr Verified Voting")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("Vote securely using your Gov.gr Solemn Declaration")}
                    </DialogDescription>
                </DialogHeader>

                {/* Step 1: Instructions */}
                {step === "instructions" && (
                    <div className="space-y-4">
                        {tokenMutation.isPending ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="ml-2">{t("Generating voting token...")}</span>
                            </div>
                        ) : instructions ? (
                            <>
                                <Alert className="bg-blue-50 border-blue-200">
                                    <Shield className="h-4 w-4 text-blue-600" />
                                    <AlertTitle className="text-blue-800">{t('footer.howItWorks')}</AlertTitle>
                                    <AlertDescription className="text-blue-700">
                                        {t("Your vote is verified using a digitally signed Gov.gr Solemn Declaration. This ensures one person, one vote with government-level security.")}
                                    </AlertDescription>
                                </Alert>

                                <Card>
                                    <CardContent className="p-4 space-y-4">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                                            {t("Go to Gov.gr")}
                                        </h4>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between"
                                            onClick={() => window.open(instructions.link, "_blank")}
                                        >
                                            <span>{t("Open Gov.gr Solemn Declaration")}</span>
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>

                                        <Separator />

                                        <h4 className="font-semibold flex items-center gap-2">
                                            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                                            {t("Copy this text into your declaration")}
                                        </h4>
                                        <div className="relative">
                                            <div className="bg-muted p-3 rounded-md text-sm font-mono break-all">
                                                {instructions.template_text}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="absolute top-1 right-1"
                                                onClick={handleCopyTemplate}
                                            >
                                                {copied ? (
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {t("Replace [CHOICE] with your actual vote choice from the poll options.")}
                                        </p>

                                        <Separator />

                                        <h4 className="font-semibold flex items-center gap-2">
                                            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                                            {t("Download and upload the signed PDF")}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {t("After signing your declaration on Gov.gr, download the PDF and upload it here.")}
                                        </p>
                                    </CardContent>
                                </Card>

                                <div className="text-xs text-muted-foreground">
                                    <strong>{t("Security Token")}:</strong> <code className="bg-muted px-1 rounded">{token?.poll_token}</code>
                                </div>
                            </>
                        ) : (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>{t('general.error')}</AlertTitle>
                                <AlertDescription>
                                    {t("Failed to load voting instructions. Please try again.")}
                                </AlertDescription>
                            </Alert>
                        )}

                        <DialogFooter className="flex justify-between">
                            <Button variant="outline" onClick={handleClose}>
                                {t('general.cancel')}
                            </Button>
                            <Button
                                onClick={() => setStep("upload")}
                                disabled={!instructions}
                                className="flex items-center gap-2"
                            >
                                {t("I have my PDF")}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* Step 2: Upload */}
                {step === "upload" && (
                    <div className="space-y-4">
                        <Alert className="bg-green-50 border-green-200">
                            <FileCheck className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">{t("Upload Your Signed Declaration")}</AlertTitle>
                            <AlertDescription className="text-green-700">
                                {t("Upload the PDF you downloaded from Gov.gr. We will verify the digital signature and extract your vote.")}
                            </AlertDescription>
                        </Alert>

                        <Card>
                            <CardContent className="p-6">
                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                                    <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />

                                    <Label htmlFor="ballot-file" className="cursor-pointer">
                                        <div className="space-y-2">
                                            <p className="font-medium">{t("Click to select PDF")}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {t("or drag and drop")}
                                            </p>
                                        </div>
                                    </Label>

                                    <Input
                                        id="ballot-file"
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />

                                    {selectedFile && (
                                        <div className="mt-4 p-3 bg-muted rounded-md flex items-center gap-2">
                                            <FileCheck className="h-5 w-5 text-green-600" />
                                            <span className="text-sm font-medium">{selectedFile.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                ({(selectedFile.size / 1024).toFixed(1)} KB)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <DialogFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep("instructions")}>
                                {t('general.back')}
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!selectedFile || validateMutation.isPending}
                                className="flex items-center gap-2"
                            >
                                {validateMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {t("Verifying...")}
                                    </>
                                ) : (
                                    <>
                                        <Shield className="h-4 w-4" />
                                        {t("Verify & Submit Vote")}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* Step 3: Result */}
                {step === "result" && validationResult && (
                    <div className="space-y-4">
                        {validationResult.success ? (
                            <>
                                <div className="text-center py-6">
                                    <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
                                    <h3 className="text-xl font-semibold text-green-800 mb-2">
                                        {t("Vote Recorded Successfully!")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {t("Your vote has been verified and counted.")}
                                    </p>
                                </div>

                                <Card className="bg-green-50 border-green-200">
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium">{t("Your Vote")}:</span>
                                            <span className="text-sm font-bold">{validationResult.vote_choice}</span>
                                        </div>
                                        {validationResult.signer_name && (
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium">{t("Verified By")}:</span>
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
                                    <h3 className="text-xl font-semibold text-red-800 mb-2">
                                        {t("Verification Failed")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {validationResult.message}
                                    </p>
                                </div>

                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>{t("Rejection Reason")}</AlertTitle>
                                    <AlertDescription>
                                        {getRejectionMessage(validationResult.rejection_reason)}
                                    </AlertDescription>
                                </Alert>
                            </>
                        )}

                        <DialogFooter className="flex justify-between">
                            {!validationResult.success && (
                                <Button variant="outline" onClick={handleStartOver}>
                                    {t("Try Again")}
                                </Button>
                            )}
                            <Button onClick={handleClose}>
                                {t('general.close')}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// Helper function to translate rejection reasons
function getRejectionMessage(reason?: string): string {
    const messages: Record<string, string> = {
        invalid_signature: t("The PDF signature is invalid or has been tampered with."),
        no_signature: t("The PDF does not contain a digital signature from Gov.gr."),
        unknown_signer: t("The PDF was not signed by a recognized government authority."),
        duplicate_file: t("This declaration has already been submitted."),
        already_voted: t("You have already voted in this poll."),
        invalid_token: t("The voting session has expired. Please start over."),
        token_not_found: t("The security token was not found in your declaration. Make sure you copied the template correctly."),
        afm_not_found: t("Could not find your Tax ID (AFM) in the declaration."),
        vote_choice_not_found: t("Could not find your vote choice. Please use the format: 'vote for [OPTION]'"),
        pdf_read_error: t("Could not read the PDF file. Please make sure it's a valid PDF."),
    };
    return messages[reason || ""] || t("An unknown error occurred.");
}
