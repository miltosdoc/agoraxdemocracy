import { useTranslation } from "@/hooks/use-translation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Separator } from "@/components/ui/separator";

export default function TermsPage() {
  const { t, locale } = useTranslation();
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16 pb-16 sm:pb-6">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">{t('footer.terms')}</h1>
            
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Αποδοχή των Όρων</h2>
                <p className="text-muted-foreground mb-4">
                  Η πρόσβαση και χρήση της πλατφόρμας AgoraX διέπεται από τους παρόντες Όρους Χρήσης. 
                  Χρησιμοποιώντας την πλατφόρμα μας, συμφωνείτε με όλους τους όρους και τις προϋποθέσεις που περιγράφονται 
                  εδώ. Εάν δεν συμφωνείτε με αυτούς τους όρους, παρακαλούμε να μην χρησιμοποιείτε την πλατφόρμα.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Λογαριασμοί Χρηστών</h2>
                <p className="text-muted-foreground mb-4">
                  Για να χρησιμοποιήσετε ορισμένες λειτουργίες της πλατφόρμας, πρέπει να δημιουργήσετε έναν λογαριασμό. 
                  Είστε υπεύθυνοι για τη διατήρηση της εμπιστευτικότητας του λογαριασμού σας και του κωδικού πρόσβασης, 
                  καθώς και για όλες τις δραστηριότητες που πραγματοποιούνται μέσω του λογαριασμού σας. Δεσμεύεστε να 
                  παρέχετε ακριβείς και πλήρεις πληροφορίες κατά την εγγραφή και να τις διατηρείτε ενημερωμένες.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Κανόνες Συμπεριφοράς</h2>
                <p className="text-muted-foreground mb-4">
                  Κατά τη χρήση της πλατφόρμας AgoraX, συμφωνείτε να μην:
                </p>
                <ul className="list-disc pl-8 text-muted-foreground space-y-2">
                  <li>Δημοσιεύετε περιεχόμενο που είναι παράνομο, προσβλητικό, συκοφαντικό, ή παραβιάζει τα δικαιώματα τρίτων.</li>
                  <li>Χρησιμοποιείτε την πλατφόρμα για διαφημιστικούς ή εμπορικούς σκοπούς χωρίς προηγούμενη έγκριση.</li>
                  <li>Δημιουργείτε πολλαπλούς λογαριασμούς ή παραπλανητικές ψηφοφορίες.</li>
                  <li>Παρενοχλείτε, απειλείτε ή εκφοβίζετε άλλους χρήστες.</li>
                  <li>Παραβιάζετε την ασφάλεια της πλατφόρμας ή επιχειρείτε να αποκτήσετε πρόσβαση σε δεδομένα άλλων χρηστών.</li>
                </ul>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Περιεχόμενο Χρηστών</h2>
                <p className="text-muted-foreground mb-4">
                  Το περιεχόμενο που δημιουργείτε στην πλατφόρμα (όπως ψηφοφορίες, σχόλια, προφίλ) παραμένει δική σας 
                  πνευματική ιδιοκτησία. Ωστόσο, παραχωρείτε στο AgoraX μια παγκόσμια, μη αποκλειστική, μεταβιβάσιμη και 
                  χωρίς δικαιώματα εκμετάλλευσης άδεια να χρησιμοποιεί, αναπαράγει και προβάλλει αυτό το περιεχόμενο 
                  για σκοπούς λειτουργίας της πλατφόρμας.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Τροποποιήσεις και Διακοπή Υπηρεσιών</h2>
                <p className="text-muted-foreground mb-4">
                  Διατηρούμε το δικαίωμα να τροποποιήσουμε ή να διακόψουμε, προσωρινά ή μόνιμα, την πλατφόρμα (ή μέρος αυτής) 
                  χωρίς προηγούμενη ειδοποίηση. Επίσης, μπορούμε να ενημερώνουμε αυτούς τους Όρους Χρήσης κατά διαστήματα. 
                  Οι τροποποιήσεις τίθενται σε ισχύ με τη δημοσίευσή τους στην πλατφόρμα. Η συνεχιζόμενη χρήση της πλατφόρμας 
                  μετά από τέτοιες αλλαγές συνιστά αποδοχή των νέων όρων.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Περιορισμός Ευθύνης</h2>
                <p className="text-muted-foreground mb-4">
                  Η πλατφόρμα AgoraX παρέχεται "ως έχει" και "όπως είναι διαθέσιμη". Δεν παρέχουμε καμία εγγύηση για 
                  την ακρίβεια, πληρότητα, αξιοπιστία ή διαθεσιμότητα της πλατφόρμας. Σε καμία περίπτωση δεν θα είμαστε 
                  υπεύθυνοι για άμεσες, έμμεσες, τυχαίες, ειδικές ή επακόλουθες ζημίες που προκύπτουν από τη χρήση ή 
                  την αδυναμία χρήσης της πλατφόρμας.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Επικοινωνία</h2>
                <p className="text-muted-foreground mb-4">
                  Για οποιαδήποτε ερώτηση σχετικά με τους Όρους Χρήσης, μπορείτε να επικοινωνήσετε μαζί μας στο 
                  <a href="mailto:agoraxdemocracy@gmail.com" className="text-primary ml-1">agoraxdemocracy@gmail.com</a>.
                </p>
              </section>
              
              <div className="bg-muted p-6 rounded-lg mt-8">
                <p className="text-muted-foreground text-sm">
                  Τελευταία ενημέρωση: 2 Μαΐου 2025
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Αποδεχόμενοι τους όρους χρήσης, αναγνωρίζετε ότι έχετε διαβάσει, κατανοήσει και συμφωνήσει να 
                  δεσμεύεστε από αυτούς τους όρους και προϋποθέσεις.
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