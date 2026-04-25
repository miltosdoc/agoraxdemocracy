import { useTranslation } from "@/hooks/use-translation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16 pb-16 sm:pb-6">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">{t('auth.privacyPolicy')}</h1>

          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Εισαγωγή</h2>
              <p className="mb-3">
                Η AgoraX σέβεται την ιδιωτικότητά σας και δεσμεύεται να προστατεύει τα προσωπικά σας δεδομένα. Αυτή η Πολιτική Απορρήτου εξηγεί 
                πώς συλλέγουμε, χρησιμοποιούμε, αποθηκεύουμε και προστατεύουμε τις πληροφορίες σας κατά τη χρήση της πλατφόρμας διαβουλευτικής 
                δημοκρατίας AgoraX. Χρησιμοποιώντας την πλατφόρμα, συμφωνείτε με την παρούσα πολιτική.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Πληροφορίες που Συλλέγουμε</h2>
              <p className="mb-3">
                Συλλέγουμε το ελάχιστο απαραίτητο σύνολο δεδομένων για τη λειτουργία της πλατφόρμας:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>
                  <strong className="text-foreground">Βασικά στοιχεία λογαριασμού:</strong> όνομα χρήστη, διεύθυνση email και κωδικός πρόσβασης που αποθηκεύεται κρυπτογραφημένος.
                </li>
                <li>
                  <strong className="text-foreground">Προφίλ:</strong> ενωμερώσεις που επιλέγετε να κοινοποιήσετε (τόπος, θεματικές κατηγορίες ενδιαφέροντος, κλπ.).
                </li>
                <li>
                  <strong className="text-foreground">Στοιχεία δραστηριοτήτων:</strong> προτάσεις που υποβάλλετε, τροπολογίες που υποβάλλετε, ψήφοι σε αμοιβαίες αξιολογήσεις και ψηφοφορίες επικύρωσης, κοινότητες στις οποίες συμμετέχετε.
                </li>
                <li>
                  <strong className="text-foreground">Τεχνικά στοιχεία:</strong> διεύθυνση IP, τύπος περιηγητή, συσκευής, και στοιχεία συνεδρίας (session cookies).
                </li>
                <li>
                  <strong className="text-foreground">Δεδομένα επαλήθευσης ταυτότητας:</strong> μεταδεδομένα επικύρωσης μέσω Gov.gr (δεν αποθηκεύουμε τα προσωπικά στοιχεία ταυτότητας που ανταλλάσσετε με το κράτος).
                </li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Χρήση των Δεδομένων σας</h2>
              <p className="mb-3">
                Τα δεδομένα σας χρησιμοποιούνται αποκλειστικά για τους εξής σκοπούς:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Λειτουργία της πλατφόρμας (εγγραφή, υποβολή προτάσεων, ψηφοφορίες, κλήρωση).</li>
                <li>Επικύρωση ταυτότητας για ασφαλείς ψηφοφορίες μέσω εξωτερικών υπηρεσιών (Gov.gr).</li>
                <li>Βελτίωση της πλατφόρμας ανώνυμα (στατιστικά δεδομένα χρήσης, που δεν ταυτοποιούνται με συγκεκριμένους χρήστες).</li>
                <li>Αναγνώριση και προστασία από κακόβουλες δραστηριότητες (bots, πολυλογαριασμός, ψευδής ταυτότητα).</li>
                <li>Επικοινωνία μαζί σας για θέματα σχετικά με το λογαριασμό σας (επαλήθευση email, ειδοποιήσεις προθεσμιών κλήρωσης).</li>
              </ul>
              <p>
                <strong className="text-foreground">Δεν πουλάμε ούτε μισθώνουμε τα δεδομένα σας σε τρίτους.</strong> Δεν χρησιμοποιούμε cookies παρακολούθησης ή διαφήμισης.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Επαλήθευση Ταυτότητας μέσω Gov.gr</h2>
              <p className="mb-3">
                Για ψηφοφορίες αυξημένης ασφάλειας, ταυτοποιείστε την ταυτότητά σας μέσω της υπηρεσίας Gov.gr του ελληνικού κράτους ή κρυπτογραφικών υπογραφών.
                Η AgoraX δεν λαμβάνει ούτε αποθηκεύει τα προσωπικά στοιχεία ταυτότητας (AMKA, ΑΦΜ, κλπ.). 
                Λαμβάνουμε μόνο ένα αποτέλεσμα επικύρωσης (επιτυχία/αποτυχία) και ένα μοναδικό αναγνωριστικό επικύρωσης χωρίς να μπορούμε να συνδέσουμε
                την ψήφο με την πραγματική σας ταυτότητα. Η ανωνυμία της ψήφου είναι πλήρως διαφυλαγμένη.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Αποθήκευση και Ασφάλεια Δεδομένων</h2>
              <p className="mb-3">
                Τα δεδομένα αποθηκεύονται σε ασφαλείς διακομιστές με κρυπτογράφηση σε αναπαύστα κατάσταση. Οι κωδικοί πρόσβασης αποθηκεύονται με σχήμα 
                Argon2id ή bcrypt και δεν μπορούν να ανακτηθούν. Χρησιμοποιούμε HTTPS σε όλες τις συνδέσεις και η πρόσβαση στη βάση δεδομένων είναι 
                περιορισμένη με SSL και στατική πιστοποίηση IP. Η πλατφόρμα δεν χρησιμοποιεί προστθέτες υπηρεσίες analytics ή tracking που 
                μοιράζονται με τρίτους (π.χ. Google Analytics, Facebook Pixel).
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Διάρκεια Τήρησης</h2>
              <p className="mb-3">
                Διατηρούμε τα δεδομένα σας μόνο όσο είναι απαραίτητο για το σκοπό για τον οποίο συλλέχθηκαν:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Στοιχεία λογαριασμού: μέχρι να ζητήσετε την διαγραφή τους.</li>
                <li>Προτάσεις και τροπολογίες: μόνιμα (είναι δημόσιο περιεχόμενο της πλατφόρμας).</li>
                <li>Ψήφοι: μόνιμα, ανώνυμες, με κρυπτογραφικό αντίγραφο για επαλήθευση ακεραιότητας.</li>
                <li>Λογαριασμοί που δεν έχουν ενεργοποιηθεί γιά πάνω από 12 μήνες: διαγράφονται αυτόματα.</li>
                <li>Δεδομένα επικύρωσης ταυτότητας μέσω Gov.gr: διαγράφονται αμέσως μετά την επιτυχή επικύρωση — μενει μόνο ένας μοναδικός επικυρωμένος αριθμός ψήφου χωρίς ταυτοποίηση.
                </li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Δικαιώματα Χρηστών</h2>
              <p className="mb-3">
                Έχετε δικαίωμα να:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Ζητήσετε πρόσβαση στα δεδομένα σας που διατηρούνται στο σύστημά μας.</li>
                <li>Ζητήσετε την διαγραφή του λογαριασμού σας και όλων των συνδεδεμένων δεδομένων (με την επιφύλαξη των δημόσιων προτάσεων και τροπολογιών).</li>
                <li>Ζητήσετε τη διόρθωση των ανακριβών στοιχείων του προφίλ σας.</li>
                <li>Ζητήσετε αντίγραφο των δεδομένων σας σε προσβάσιμη μορφή.</li>
                <li>Αντιταθείτε στην επεξεργασία των δεδομένων σας (με εξαίρεση όσων είναι απαραίτητα για τη λειτουργία του λογαριασμού σας).</li>
              </ul>
              <p>
                Για να ασκήσετε τα δικαιώματά σας, επικοινωνήστε μαζί μας στο
                <a href="mailto:agoraxdemocracy@gmail.com" className="text-primary ml-1 hover:underline">agoraxdemocracy@gmail.com</a>.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Cookies</h2>
              <p className="mb-3">
                Χρησιμοποιούμε μόνο απαραίτητα cookies για τη λειτουργία της πλατφόρμας που συμπεριλαμβάνουν: το σύστημα session σύνδεσης χρήστη και την προτίμηση γλώσσας. 
                Δεν χρησιμοποιούμε tracking cookies, analytics cookies ή κάθε είδους cookies παρακολούθησης τρίτων.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Αλλαγές στην Πολιτική Απορρήτου</h2>
              <p className="mb-3">
                Μπορεί να ενημερώνουμε την παρούσα πολιτική περιοδικά. Οι σημαντικές αλλαγές θα σας ενημερώνονται μέσω email ή επισήμανση στην πλατφόρμα. 
                Η συνεχιζόμενη χρήση της πλατφόρμας μετά τις αλλαγές συνιστά αποδοχή της νέας πολιτικής.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Επικοινωνία</h2>
              <p>
                Για ερωτήσεις σχετικά με την προστασία προσωπικών δεδομένων, μπορείτε να επικοινωνήσετε μαζί μας στο
                <a href="mailto:agoraxdemocracy@gmail.com" className="text-primary ml-1 hover:underline">agoraxdemocracy@gmail.com</a>.
              </p>
            </section>

            <div className="bg-muted p-6 rounded-lg mt-8">
              <p className="text-sm text-muted-foreground">
                Τελευταία ενημέρωση: 2 Μαΐου 2025
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Η χρήση της πλατφόρμας AgoraX υποδηλώνει αποδοχή της παρούσας Πολιτικής Απορρήτου.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
