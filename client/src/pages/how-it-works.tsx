import { useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useTranslation } from "@/hooks/use-translation";

export default function HowItWorksPage() {
  const { t, locale } = useTranslation();
  // Set page title when component mounts
  useEffect(() => {
    document.title = `AgoraX - ${t('footer.howItWorks')}`;
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-16 sm:pb-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">{t('footer.howItWorks')}</h1>
          
          <div className="space-y-8">
            <section className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Πώς λειτουργεί το AgoraX</h2>
              <p className="mb-4">
                Το AgoraX είναι μια πλατφόρμα ψηφιακής δημοκρατίας που επιτρέπει στους πολίτες να συμμετέχουν ενεργά στη λήψη αποφάσεων μέσω διαφανών και αξιόπιστων ψηφοφοριών.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-6">
                <div className="flex flex-col items-center text-center p-4">
                  <div className="bg-primary/10 rounded-full p-4 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Δημιουργία</h3>
                  <p className="text-muted-foreground">Εγγραφείτε και δημιουργήστε νέες ψηφοφορίες για θέματα που αφορούν την κοινότητά σας.</p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <div className="bg-primary/10 rounded-full p-4 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Συμμετοχή</h3>
                  <p className="text-muted-foreground">Ψηφίστε σε ανοιχτές ψηφοφορίες και μοιραστείτε τις απόψεις σας μέσω σχολίων.</p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <div className="bg-primary/10 rounded-full p-4 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Αποτελέσματα</h3>
                  <p className="text-muted-foreground">Δείτε τα αποτελέσματα των ψηφοφοριών και κατανοήστε τις απόψεις της κοινότητας.</p>
                </div>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Διαδικασία Ψηφοφορίας</h2>
              <ol className="list-decimal pl-5 space-y-4">
                <li className="pl-2">
                  <h3 className="font-medium text-lg">Δημιουργία λογαριασμού</h3>
                  <p>Εγγραφείτε στην πλατφόρμα χρησιμοποιώντας το email σας ή τον λογαριασμό σας στο Google.</p>
                </li>
                <li className="pl-2">
                  <h3 className="font-medium text-lg">Περιήγηση στις ενεργές ψηφοφορίες</h3>
                  <p>Εξερευνήστε τις τρέχουσες ψηφοφορίες στην αρχική σελίδα της πλατφόρμας.</p>
                </li>
                <li className="pl-2">
                  <h3 className="font-medium text-lg">Συμμετοχή σε ψηφοφορία</h3>
                  <p>Επιλέξτε μια ψηφοφορία, διαβάστε τις λεπτομέρειες και τις επιλογές, και υποβάλετε την ψήφο σας.</p>
                </li>
                <li className="pl-2">
                  <h3 className="font-medium text-lg">Παρακολούθηση αποτελεσμάτων</h3>
                  <p>Μετά την ολοκλήρωση της ψηφοφορίας, δείτε τα αποτελέσματα και τα σχόλια άλλων συμμετεχόντων.</p>
                </li>
              </ol>
            </section>

            <section className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Δημιουργία Ψηφοφορίας</h2>
              <div className="space-y-4">
                <p>Για να δημιουργήσετε μια νέα ψηφοφορία:</p>
                <ol className="list-decimal pl-5 space-y-3">
                  <li className="pl-2">Συνδεθείτε στο λογαριασμό σας.</li>
                  <li className="pl-2">Πατήστε το κουμπί "Νέα Ψηφοφορία" στην επάνω μπάρα πλοήγησης.</li>
                  <li className="pl-2">Συμπληρώστε τον τίτλο, την περιγραφή και επιλέξτε κατηγορία για την ψηφοφορία σας.</li>
                  <li className="pl-2">Προσθέστε τις επιλογές ψηφοφορίας.</li>
                  <li className="pl-2">Καθορίστε τη διάρκεια και τις ρυθμίσεις ορατότητας της ψηφοφορίας.</li>
                  <li className="pl-2">Υποβάλετε και δημοσιεύστε την ψηφοφορία σας.</li>
                </ol>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Ασφάλεια και Διαφάνεια</h2>
              <div className="space-y-4">
                <p>Στο AgoraX, δίνουμε προτεραιότητα στην ασφάλεια και τη διαφάνεια των ψηφοφοριών:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li className="pl-2">Κάθε χρήστης μπορεί να ψηφίσει μόνο μία φορά σε κάθε ψηφοφορία.</li>
                  <li className="pl-2">Τα αποτελέσματα των ψηφοφοριών είναι διαθέσιμα σε όλους τους συμμετέχοντες.</li>
                  <li className="pl-2">Οι ψηφοφορίες μπορούν να περιοριστούν με βάση γεωγραφικά κριτήρια για τοπικά θέματα.</li>
                  <li className="pl-2">Προστατεύουμε τα προσωπικά δεδομένα των χρηστών μας σύμφωνα με την Πολιτική Απορρήτου.</li>
                </ul>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Χρειάζεστε Βοήθεια;</h2>
              <p className="mb-4">
                Εάν έχετε περισσότερες ερωτήσεις σχετικά με τη χρήση της πλατφόρμας, επισκεφτείτε τη σελίδα 
                <a href="/faq" className="text-primary hover:underline ml-1">Συχνών Ερωτήσεων</a> ή 
                <a href="#" className="text-primary hover:underline ml-1">επικοινωνήστε μαζί μας</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}