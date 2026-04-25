import { useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useTranslation } from "@/hooks/use-translation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
  const { t, locale } = useTranslation();
  // Set page title when component mounts
  useEffect(() => {
    document.title = `AgoraX - ${t('footer.faq')}`;
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-16 sm:pb-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">{t('footer.faq')}</h1>
          
          <div className="space-y-8">
            <p className="text-lg text-muted-foreground mb-6">
              Συχνές ερωτήσεις σχετικά με την πλατφόρμα AgoraX και τον τρόπο λειτουργίας της.
            </p>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  Τι είναι το AgoraX;
                </AccordionTrigger>
                <AccordionContent>
                  Το AgoraX είναι μια πλατφόρμα ψηφιακής δημοκρατίας που επιτρέπει στους πολίτες να συμμετέχουν ενεργά 
                  στη λήψη αποφάσεων μέσω διαφανών και αξιόπιστων ψηφοφοριών. Η πλατφόρμα δημιουργήθηκε για να προάγει 
                  τη συμμετοχική δημοκρατία και να δώσει φωνή στους πολίτες σε θέματα που τους αφορούν.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  Πώς μπορώ να δημιουργήσω λογαριασμό στο AgoraX;
                </AccordionTrigger>
                <AccordionContent>
                  Μπορείτε να δημιουργήσετε λογαριασμό στο AgoraX πατώντας το κουμπί "Εγγραφή" στην αρχική σελίδα. 
                  Θα χρειαστεί να συμπληρώσετε το ονοματεπώνυμό σας, ένα όνομα χρήστη, το email σας και έναν κωδικό πρόσβασης. 
                  Εναλλακτικά, μπορείτε να συνδεθείτε με τον λογαριασμό σας στο Google. Μετά την εγγραφή σας, θα έχετε πρόσβαση 
                  σε όλες τις λειτουργίες της πλατφόρμας.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  Πώς μπορώ να συμμετάσχω σε μια ψηφοφορία;
                </AccordionTrigger>
                <AccordionContent>
                  Για να συμμετάσχετε σε μια ψηφοφορία, θα πρέπει πρώτα να συνδεθείτε στον λογαριασμό σας. Μετά, μπορείτε 
                  να περιηγηθείτε στις ενεργές ψηφοφορίες από την αρχική σελίδα. Επιλέξτε μια ψηφοφορία που σας ενδιαφέρει, 
                  διαβάστε τις λεπτομέρειες και τις επιλογές, και πατήστε το κουμπί "Ψηφίστε". Στο αναδυόμενο παράθυρο, 
                  επιλέξτε την απάντησή σας και υποβάλετε την ψήφο σας.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">
                  Πώς μπορώ να δημιουργήσω μια νέα ψηφοφορία;
                </AccordionTrigger>
                <AccordionContent>
                  Για να δημιουργήσετε μια νέα ψηφοφορία, συνδεθείτε στον λογαριασμό σας και πατήστε το κουμπί "Νέα Ψηφοφορία" 
                  στο πάνω μέρος της σελίδας. Συμπληρώστε τον τίτλο, την περιγραφή και επιλέξτε κατηγορία για την ψηφοφορία σας. 
                  Προσθέστε τις επιλογές ψήφου και καθορίστε τη διάρκεια και τις ρυθμίσεις ορατότητας. Μπορείτε επίσης να ορίσετε 
                  γεωγραφικούς περιορισμούς αν η ψηφοφορία αφορά συγκεκριμένη περιοχή. Τέλος, πατήστε "Δημιουργία Ψηφοφορίας" για 
                  να δημοσιεύσετε την ψηφοφορία σας.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left">
                  Μπορώ να δω τα αποτελέσματα μιας ψηφοφορίας;
                </AccordionTrigger>
                <AccordionContent>
                  Τα αποτελέσματα των ψηφοφοριών είναι διαθέσιμα ανάλογα με τις ρυθμίσεις που έχει ορίσει ο δημιουργός. 
                  Σε ορισμένες ψηφοφορίες, τα αποτελέσματα είναι ορατά κατά τη διάρκεια της ψηφοφορίας, ενώ σε άλλες 
                  εμφανίζονται μόνο μετά την ολοκλήρωσή της. Για να δείτε τα αποτελέσματα μιας ψηφοφορίας, επισκεφθείτε 
                  τη σελίδα λεπτομερειών της ψηφοφορίας και πατήστε το κουμπί "Αποτελέσματα", εφόσον είναι διαθέσιμο.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-6">
                <AccordionTrigger className="text-left">
                  Μπορώ να σχολιάσω σε μια ψηφοφορία;
                </AccordionTrigger>
                <AccordionContent>
                  Ναι, εφόσον ο δημιουργός της ψηφοφορίας έχει ενεργοποιήσει τα σχόλια. Για να προσθέσετε ένα σχόλιο, 
                  επισκεφθείτε τη σελίδα λεπτομερειών της ψηφοφορίας και χρησιμοποιήστε το πεδίο σχολίων στο κάτω μέρος 
                  της σελίδας. Τα σχόλια είναι ορατά σε όλους τους χρήστες που έχουν πρόσβαση στην ψηφοφορία.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-7">
                <AccordionTrigger className="text-left">
                  Πώς μπορώ να μοιραστώ μια ψηφοφορία με άλλους;
                </AccordionTrigger>
                <AccordionContent>
                  Για να μοιραστείτε μια ψηφοφορία, επισκεφθείτε τη σελίδα λεπτομερειών της ψηφοφορίας και πατήστε το 
                  κουμπί "Μοιραστείτε". Θα εμφανιστούν επιλογές για αντιγραφή του συνδέσμου ή κοινοποίηση στα μέσα 
                  κοινωνικής δικτύωσης όπως το Facebook. Μπορείτε επίσης να αντιγράψετε απευθείας τον σύνδεσμο από τη 
                  γραμμή διευθύνσεων του φυλλομετρητή σας.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-8">
                <AccordionTrigger className="text-left">
                  Τι γίνεται με την ασφάλεια των δεδομένων μου;
                </AccordionTrigger>
                <AccordionContent>
                  Το AgoraX δεσμεύεται για την προστασία των προσωπικών σας δεδομένων. Οι κωδικοί πρόσβασης κρυπτογραφούνται 
                  και δεν αποθηκεύονται σε μορφή απλού κειμένου. Τα προσωπικά σας στοιχεία χρησιμοποιούνται μόνο για τους 
                  σκοπούς λειτουργίας της πλατφόρμας και δεν κοινοποιούνται σε τρίτους χωρίς τη συγκατάθεσή σας. 
                  Για περισσότερες πληροφορίες, ανατρέξτε στην Πολιτική Απορρήτου μας.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-9">
                <AccordionTrigger className="text-left">
                  Μπορώ να επεκτείνω τη διάρκεια μιας ψηφοφορίας;
                </AccordionTrigger>
                <AccordionContent>
                  Ναι, αν είστε ο δημιουργός μιας ψηφοφορίας και έχετε επιλέξει να επιτρέπεται η επέκταση, μπορείτε να 
                  παρατείνετε τη διάρκειά της. Για να το κάνετε αυτό, επισκεφθείτε τη σελίδα λεπτομερειών της ψηφοφορίας 
                  και πατήστε το κουμπί "Επέκταση". Θα μπορέσετε να ορίσετε μια νέα ημερομηνία λήξης για την ψηφοφορία σας.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-10">
                <AccordionTrigger className="text-left">
                  Πώς μπορώ να επικοινωνήσω με την ομάδα υποστήριξης;
                </AccordionTrigger>
                <AccordionContent>
                  Για οποιαδήποτε απορία ή πρόβλημα, μπορείτε να επικοινωνήσετε με την ομάδα υποστήριξης του AgoraX 
                  στέλνοντας email στο agoraxdemocracy@gmail.com. Εναλλακτικά, μπορείτε να μας καλέσετε στο +30 210 1234567 
                  κατά τις εργάσιμες ώρες (Δευτέρα-Παρασκευή, 9:00-17:00). Θα χαρούμε να σας βοηθήσουμε με οποιοδήποτε 
                  ζήτημα αντιμετωπίζετε.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="bg-card rounded-lg p-6 shadow-sm mt-8">
              <h2 className="text-2xl font-semibold mb-4">Έχετε άλλες ερωτήσεις;</h2>
              <p className="mb-4">
                Αν δεν βρήκατε την απάντηση που ψάχνετε, μπορείτε να επικοινωνήσετε μαζί μας μέσω email ή τηλεφώνου. 
                Η ομάδα μας είναι πάντα διαθέσιμη να σας βοηθήσει και να απαντήσει σε οποιαδήποτε ερώτηση έχετε 
                σχετικά με την πλατφόρμα AgoraX.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <a 
                  href="mailto:agoraxdemocracy@gmail.com" 
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                >
                  Επικοινωνήστε μέσω Email
                </a>
                <a 
                  href="/how-it-works" 
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  Δείτε πώς λειτουργεί
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}