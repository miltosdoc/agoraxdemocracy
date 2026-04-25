import { useTranslation } from "@/hooks/use-translation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPage() {
  const { t, locale } = useTranslation();
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16 pb-16 sm:pb-6">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">{t('auth.privacyPolicy')}</h1>
            
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Εισαγωγή</h2>
                <p className="text-muted-foreground mb-4">
                  Στο AgoraX, σεβόμαστε την ιδιωτικότητά σας και δεσμευόμαστε να προστατεύουμε τα προσωπικά σας δεδομένα. 
                  Αυτή η Πολιτική Απορρήτου εξηγεί πώς συλλέγουμε, χρησιμοποιούμε και προστατεύουμε τις πληροφορίες σας 
                  κατά τη χρήση της πλατφόρμας μας. Παρακαλούμε διαβάστε προσεκτικά αυτή την πολιτική για να κατανοήσετε 
                  τις πρακτικές μας σχετικά με τα προσωπικά σας δεδομένα.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Πληροφορίες που Συλλέγουμε</h2>
                <p className="text-muted-foreground mb-4">
                  Συλλέγουμε διάφορους τύπους πληροφοριών, συμπεριλαμβανομένων:
                </p>
                <ul className="list-disc pl-8 text-muted-foreground space-y-2">
                  <li>
                    <span className="font-medium">Προσωπικά Δεδομένα:</span> Ονοματεπώνυμο, διεύθυνση email, όνομα χρήστη και 
                    κωδικό πρόσβασης κατά την εγγραφή σας.
                  </li>
                  <li>
                    <span className="font-medium">Δεδομένα Προφίλ:</span> Πληροφορίες που προσθέτετε στο προφίλ σας, 
                    συμπεριλαμβανομένης της τοποθεσίας σας.
                  </li>
                  <li>
                    <span className="font-medium">Δεδομένα Χρήσης:</span> Πληροφορίες σχετικά με τον τρόπο που χρησιμοποιείτε την 
                    πλατφόρμα, όπως οι ψηφοφορίες στις οποίες συμμετέχετε, οι ψήφοι σας και τα σχόλιά σας.
                  </li>
                  <li>
                    <span className="font-medium">Τεχνικά Δεδομένα:</span> Διεύθυνση IP, τύπος συσκευής και περιηγητή, πληροφορίες 
                    για τη συνεδρία σας και δεδομένα cookies.
                  </li>
                </ul>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Πώς Χρησιμοποιούμε τις Πληροφορίες Σας</h2>
                <p className="text-muted-foreground mb-4">
                  Χρησιμοποιούμε τις πληροφορίες που συλλέγουμε για:
                </p>
                <ul className="list-disc pl-8 text-muted-foreground space-y-2">
                  <li>Να παρέχουμε, συντηρούμε και βελτιώνουμε την πλατφόρμα AgoraX.</li>
                  <li>Να επεξεργαζόμαστε τις ψηφοφορίες και τις ψήφους σας.</li>
                  <li>Να εξατομικεύουμε την εμπειρία σας με βάση την τοποθεσία και τα ενδιαφέροντά σας.</li>
                  <li>Να επικοινωνούμε μαζί σας για σημαντικές ενημερώσεις ή αλλαγές στην πλατφόρμα.</li>
                  <li>Να διασφαλίζουμε την ασφάλεια της πλατφόρμας και να προστατεύουμε από απάτη ή κακόβουλη χρήση.</li>
                  <li>Να αναλύουμε τη χρήση της πλατφόρμας για βελτίωση των υπηρεσιών μας.</li>
                </ul>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Κοινοποίηση Πληροφοριών</h2>
                <p className="text-muted-foreground mb-4">
                  Δεν πωλούμε, ενοικιάζουμε ή μοιραζόμαστε τα προσωπικά σας δεδομένα με τρίτους για εμπορικούς σκοπούς. 
                  Μπορεί να κοινοποιήσουμε τις πληροφορίες σας μόνο στις ακόλουθες περιπτώσεις:
                </p>
                <ul className="list-disc pl-8 text-muted-foreground space-y-2">
                  <li>Με παρόχους υπηρεσιών που μας βοηθούν στη λειτουργία της πλατφόρμας.</li>
                  <li>Όταν απαιτείται από το νόμο ή σε απάντηση σε νόμιμες διαδικασίες.</li>
                  <li>Για την προστασία των δικαιωμάτων, της ιδιοκτησίας ή της ασφάλειας του AgoraX, των χρηστών μας ή του κοινού.</li>
                  <li>Με τη συγκατάθεσή σας για συγκεκριμένους σκοπούς.</li>
                </ul>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Ασφάλεια Δεδομένων</h2>
                <p className="text-muted-foreground mb-4">
                  Λαμβάνουμε κατάλληλα μέτρα ασφαλείας για την προστασία των πληροφοριών σας από μη εξουσιοδοτημένη πρόσβαση, 
                  αλλοίωση, αποκάλυψη ή καταστροφή. Αυτά περιλαμβάνουν κρυπτογράφηση δεδομένων, περιορισμούς πρόσβασης και 
                  τακτικές αναθεωρήσεις ασφαλείας. Ωστόσο, καμία μέθοδος μετάδοσης μέσω του Διαδικτύου ή ηλεκτρονικής 
                  αποθήκευσης δεν είναι 100% ασφαλής, και δεν μπορούμε να εγγυηθούμε την απόλυτη ασφάλεια.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Τα Δικαιώματά Σας</h2>
                <p className="text-muted-foreground mb-4">
                  Ανάλογα με την τοποθεσία σας, μπορεί να έχετε ορισμένα δικαιώματα σχετικά με τα προσωπικά σας δεδομένα, 
                  συμπεριλαμβανομένων:
                </p>
                <ul className="list-disc pl-8 text-muted-foreground space-y-2">
                  <li>Του δικαιώματος πρόσβασης στα προσωπικά σας δεδομένα.</li>
                  <li>Του δικαιώματος διόρθωσης ανακριβών πληροφοριών.</li>
                  <li>Του δικαιώματος διαγραφής των προσωπικών σας δεδομένων.</li>
                  <li>Του δικαιώματος περιορισμού ή εναντίωσης στην επεξεργασία.</li>
                  <li>Του δικαιώματος φορητότητας των δεδομένων.</li>
                  <li>Του δικαιώματος υποβολής καταγγελίας σε εποπτική αρχή.</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Για να ασκήσετε αυτά τα δικαιώματα, επικοινωνήστε μαζί μας στο 
                  <a href="mailto:agoraxdemocracy@gmail.com" className="text-primary ml-1">agoraxdemocracy@gmail.com</a>.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Cookies και Παρόμοιες Τεχνολογίες</h2>
                <p className="text-muted-foreground mb-4">
                  Χρησιμοποιούμε cookies και παρόμοιες τεχνολογίες για να βελτιώσουμε την εμπειρία σας στην πλατφόρμα, 
                  να αναλύσουμε τη χρήση και να εξατομικεύσουμε το περιεχόμενο. Μπορείτε να ελέγξετε τα cookies μέσω 
                  των ρυθμίσεων του περιηγητή σας, αλλά η απενεργοποίησή τους μπορεί να επηρεάσει τη λειτουργικότητα 
                  της πλατφόρμας.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Αλλαγές σε Αυτή την Πολιτική</h2>
                <p className="text-muted-foreground mb-4">
                  Μπορεί να ενημερώνουμε αυτή την Πολιτική Απορρήτου κατά καιρούς για να αντικατοπτρίζει αλλαγές στις 
                  πρακτικές μας ή για άλλους λειτουργικούς, νομικούς ή κανονιστικούς λόγους. Θα δημοσιεύουμε την 
                  ενημερωμένη πολιτική στην πλατφόρμα και θα ενημερώνουμε την ημερομηνία αναθεώρησης. Σας ενθαρρύνουμε 
                  να ελέγχετε τακτικά αυτή την πολιτική για τυχόν αλλαγές.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Επικοινωνία</h2>
                <p className="text-muted-foreground mb-4">
                  Εάν έχετε ερωτήσεις ή ανησυχίες σχετικά με αυτή την Πολιτική Απορρήτου ή τις πρακτικές διαχείρισης 
                  δεδομένων μας, επικοινωνήστε μαζί μας στο 
                  <a href="mailto:agoraxdemocracy@gmail.com" className="text-primary ml-1">agoraxdemocracy@gmail.com</a>.
                </p>
              </section>
              
              <div className="bg-muted p-6 rounded-lg mt-8">
                <p className="text-muted-foreground text-sm">
                  Τελευταία ενημέρωση: 2 Μαΐου 2025
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Χρησιμοποιώντας την πλατφόρμα AgoraX, αναγνωρίζετε ότι έχετε διαβάσει και κατανοήσει αυτή την Πολιτική Απορρήτου.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}