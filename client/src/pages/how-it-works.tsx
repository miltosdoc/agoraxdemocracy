import { useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import {
  FileText, CheckCircle, Edit3, TrendingUp, Users, Vote,
  Shield, ArrowRight, Zap, Globe, Lock
} from "lucide-react";

export default function HowItWorksPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title = `AgoraX — ${t('footer.howItWorks')}`;
  }, []);

  const phases = [
    {
      step: 1,
      icon: FileText,
      color: "blue",
      title: t('walkthrough.step1_name') || "Υποβολή Πρότασης",
      description: "Οποιοσδήποτε μέλος της κοινότητας μπορεί να υποβάλλει μια πρόταση, διατυπώνοντας ένα συγκεκριμένο ερώτημα και μια προτεινόμενη λύση. Οι προτάσεις ανήκουν σε θεματικές κατηγορίες και υποβάλλονται σε κοινότητες πολιτών.",
      features: ["Καθαρή δομή: Ερώτημα + Λύση", "Κατηγοριοποίηση ανά θεματική", "Σύνδεση με κοινότητα πολιτών"]
    },
    {
      step: 2,
      icon: CheckCircle,
      color: "green",
      title: t('walkthrough.step2_name') || "Επικύρωση LLM",
      description: "Πριν μπει σε διαβούλευση, η πρόταση αξιολογείται αυτόματα από ένα LLM σε πέντε άξονες: δομή, συγκεκριμενοποίηση, εφικτότητα, πληρότητα, διαφάνεια. Αυτό εξασφαλίζει ποιότητα και μειώνει τον θόρυβο.",
      features: ["Σκορ 0-100 με διαφάνεια", "Τρεις ζώνες: Επιστροφής (<20), Κλήρωσης (20-90), Αυτόματη (>90)", "Διασφάλιση ποιότητας από την αρχή"]
    },
    {
      step: 3,
      icon: Edit3,
      color: "indigo",
      title: t('walkthrough.step3_name') || "Ανασκόπηση Συγγραφέα",
      description: "Η κοινότητα υποβάλλει τροπολογίες στη βελτίωση της πρότασης. Ο αρχικός συγγραφέας διατηρεί το δικαίωμα να τις αποδεχτεί ή να τις απορρίψει, αιτιολογώντας την απόφασή του. Αυτό διασφαλίζει τη συνοχή του κειμένου.",
      features: ["Τροπολογίες από την κοινότητα", "Βέτο του συγγραφέα με αιτιολόγηση", "Διατήρηση της συνοχής της πρότασης"]
    },
    {
      step: 4,
      icon: TrendingUp,
      color: "amber",
      title: t('walkthrough.step4_name') || "Συμβουλή Κοινότητας",
      description: "Οι τροπολογίες που απορρίφθηκαν από τον συγγραφέα περνούν σε δημόσια κρίση. Αν η κοινότητα διαφωνεί με την απόρριψη κατά πλειοψηφία, η τροπολογία σημαίνεται για το κληρωτό σώμα — μηχανισμός εξισορρόπησης της εξουσίας του συγγραφέα.",
      features: ["Up/down voting σε απορριφθείσες τροπολογίες", "Κατώφλι 50% για σήμανση", "Εξισορρόπηση εξουσίας συγγραφέα"]
    },
    {
      step: 5,
      icon: Users,
      color: "purple",
      title: t('walkthrough.step5_name') || "Σύνθεση Κλήρωσης",
      description: "Ένα τυχαία επιλεγμένο σώμα πολιτών (κλήρωση) αναλαμβάνει να συνθέσει το τελικό κείμενο, ενσωματώνοντας τις αποδεκτές και τις σημασμένες τροπολογίες. Η κλήρωση εξασφαλίζει αντιπροσωπευτικότητα χωρίς κομματικό έλεγχο.",
      features: ["Τυχαία επιλογή πολιτών", "Σύνθεση τελικού κειμένου", "Αντιπροσωπευτικότητα χωρίς κομματικά φίλτρα"]
    },
    {
      step: 6,
      icon: Vote,
      color: "emerald",
      title: t('walkthrough.step6_name') || "Ψηφοφορία Επικύρωσης",
      description: "Το τελικό κείμενο τίθεται σε ψηφοφορία σε ολόκληρη την κοινότητα. Ναι ή Όχι — απλό και άμεσο. Απαιτείται υψηλό ποσοστό συμμετοχής για την ισχύ της απόφασης.",
      features: ["Δυαδική ψηφοφορία Ναι/Όχι", "Διαφανή αποτελέσματα σε πραγματικό χρόνο", "Ποσοστό συμμετοχής ως μέτρο νομιμοποίησης"]
    },
    {
      step: 7,
      icon: Shield,
      color: "red",
      title: t('walkthrough.step7_name') || "Επαληθευμένη Ψήφος",
      description: "Η ταυτότητα του ψηφοφόρου επαληθεύεται μέσω Gov.gr και κρυπτογραφικών υπογραφών, εξασφαλίζοντας ότι κάθε ψήφος προέρχεται από αυθεντικό πολίτη, χωρίς να συμβιβάζεται το απόρρητο.",
      features: ["Επαλήθευση μέσω Gov.gr", "Κρυπτογραφική υπογραφή", "Ένας πολίτης = Μία ψήφος"]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16 pb-16 sm:pb-6">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Hero */}
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-sm">{t('footer.howItWorks')}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Η Διαδικασία Διαβούλευσης
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Η AgoraX δεν είναι απλά μια πλατφόρμα ψηφοφοριών. Είναι ένα πλήρες σύστημα 
              διαβουλευτικής δημοκρατίας, σχεδιασμένο για να μετατρέπει την αυθόρμητη συμμετοχή 
              σε θεσμοθετημένες αποφάσεις — με διαφάνεια, ποιότητα και νομιμοποίηση.
            </p>
          </div>

          {/* Pipeline Overview */}
          <div className="mb-16">
            <div className="flex flex-wrap justify-center gap-3 md:gap-1">
              {phases.map((phase, i) => (
                <div key={phase.step} className="flex items-center">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-full bg-${phase.color}-50 border border-${phase.color}-200`}>
                    <phase.icon className={`w-4 h-4 text-${phase.color}-600`} />
                    <span className="text-sm font-medium">{phase.step}</span>
                  </div>
                  {i < phases.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground mx-1 md:mx-2 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Phases */}
          <div className="space-y-12">
            {phases.map((phase) => (
              <Card key={phase.step} id={`step-${phase.step}`} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-12 gap-0">
                    {/* Left: Number & Title */}
                    <div className={`md:col-span-4 bg-${phase.color}-50 p-8 flex flex-col justify-center`}>
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-${phase.color}-100 mb-4`}>
                        <phase.icon className={`w-6 h-6 text-${phase.color}-600`} />
                      </div>
                      <div className={`text-sm font-bold text-${phase.color}-600 mb-2`}>
                        ΦΑΣΗ {phase.step}
                      </div>
                      <h2 className="text-2xl font-bold mb-4">{phase.title}</h2>
                      <div className="space-y-2">
                        {phase.features.map((feat, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <div className={`w-1.5 h-1.5 rounded-full bg-${phase.color}-500 mt-1.5 shrink-0`} />
                            <span className="text-muted-foreground">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Description */}
                    <div className="md:col-span-8 p-8">
                      <p className="text-muted-foreground leading-relaxed text-lg">
                        {phase.description}
                      </p>

                      {/* Specific content per phase */}
                      {phase.step === 1 && (
                        <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
                          <div className="text-sm font-medium mb-2">Ενδεικτικό παράδειγμα:</div>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p><strong className="text-foreground">Ερώτημα:</strong> Πώς μπορούμε να μειώσουμε την κυκλοφοριακή συμφόρηση στο κέντρο της Αθήνας;</p>
                            <p><strong className="text-foreground">Λύση:</strong> Δημιουργία ζώνης χαμηλών εκπομπών (LEZ) με δωρεάν δημόσια συγκοινωνία και παροχώρηση ηλεκτρικών οχημάτων.</p>
                          </div>
                        </div>
                      )}

                      {phase.step === 2 && (
                        <div className="mt-6 grid grid-cols-5 gap-2">
                          {[
                            { label: "Δομή", score: "8/10" },
                            { label: "Συγκεκριμ.", score: "9/10" },
                            { label: "Εφικτότητα", score: "7/10" },
                            { label: "Πληρότητα", score: "8/10" },
                            { label: "Διαφάνεια", score: "9/10" },
                          ].map((item, i) => (
                            <div key={i} className="text-center p-2 bg-muted/30 rounded border">
                              <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                              <div className="font-bold text-green-600">{item.score}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {phase.step === 5 && (
                        <div className="mt-6 flex gap-4">
                          <div className="flex-1 p-4 bg-muted/30 rounded-lg border text-center">
                            <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                            <div className="text-lg font-bold">5</div>
                            <div className="text-xs text-muted-foreground">Επιλεγμένοι Πολίτες</div>
                          </div>
                          <div className="flex-1 p-4 bg-muted/30 rounded-lg border text-center">
                            <Globe className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                            <div className="text-lg font-bold">48h</div>
                            <div className="text-xs text-muted-foreground">Προθεσμία Απόκρισης</div>
                          </div>
                          <div className="flex-1 p-4 bg-muted/30 rounded-lg border text-center">
                            <Lock className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                            <div className="text-lg font-bold">Ανώνυμα</div>
                            <div className="text-xs text-muted-foreground">Χωρίς Πολιτική Ταυτότητα</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Key Innovations */}
          <div className="mt-16 mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Τι Κάνει την AgoraX Διαφορετική</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <Zap className="w-8 h-8 text-amber-500 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Διαβούλευση, Όχι Μόνο Ψηφοφορία</h3>
                  <p className="text-sm text-muted-foreground">
                    Οι προτάσεις δεν τίθενται απευθείας σε ψηφοφορία. Περνούν από φάσεις 
                    τροπολογίας, αιτιολόγησης και σύνθεσης — ώστε το τελικό κείμενο να είναι 
                    καλύτερο από την αρχική ιδέα.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Users className="w-8 h-8 text-purple-500 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Κληρωτά Σώματα, Όχι Ελίτ</h3>
                  <p className="text-sm text-muted-foreground">
                    Η σύνθεση του τελικού κειμένου ανατίθεται σε τυχαία επιλεγμένους πολίτες, 
                    όχι σε ειδικούς ή πολιτικούς. Αυτό εξασφαλίζει αντιπροσωπευτικότητα 
                    χωρίς διορισμό.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Shield className="w-8 h-8 text-red-500 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Επαληθευμένη Ταυτότητα</h3>
                  <p className="text-sm text-muted-foreground">
                    Χάρη στην ενσωμάτωση με Gov.gr, κάθε ψήφος επαληθεύεται ως 
                    προερχόμενη από πραγματικό πολίτη — αντιμετωπίζοντας το πρόβλημα 
                    των bots και των πολλαπλών λογαριασμών.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Separator className="mb-8" />
            <h2 className="text-2xl font-bold mb-4">Ξεκινήστε Τώρα</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Είτε θέλετε να υποβάλλετε μια πρόταση, να συμμετάσχετε σε μια κοινότητα, 
              είτε απλά να μάθετε περισσότερα — η πλατφόρμα είναι ανοιχτή.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={() => navigate("/walkthrough")}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Δείτε το Διαδραστικό Walkthrough
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth?tab=register")}>
                Δημιουργία Λογαριασμού
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
