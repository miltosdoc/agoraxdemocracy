import { useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title = `AgoraX — ${t('footer.faq')}`;
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16 pb-16 sm:pb-6">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-3">{t('footer.faq')}</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Απαντήσεις σε συχνές ερωτήσεις για την πλατφόρμα διαβουλευτικής δημοκρατίας AgoraX.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="item-1" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium text-base">
                Τι είναι η AgoraX;
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Η AgoraX είναι μια πλατφόρμα διαβουλευτικής δημοκρατίας. Δεν πρόκειται απλά για μια πλατφόρμα ψηφοφοριών — πρόκειται για ένα
                πλήρες σύστημα συμμετοχικής λήψης αποφάσεων: υποβολή προτάσεων, επικύρωση μέσω AI,
                τροπολογία από την κοινότητα, σύνθεση μέσω κληρωτού σώματος και τελική ψηφοφορία
                επικύρωσης με επαληθευμένη ταυτότητα.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium text-base">
                Ποια είναι η διαφορά της AgoraX από άλλες πλατφόρμες ψηφοφοριών;
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Οι περισσότερες πλατφόρμες προσφέρουν απλώς ψηφοφορίες. Η AgoraX υποστηρίζει όλη την αλυσίδα της
                διαβούλευσης: επεξεργασία των προτάσεων πριν την ψηφοφορία, διάλογος μέσω τροπολογιών,
                σύνθεση τελικού κειμένου από τυχαία επιλεγμένο σώμα (αντί του πολιτικού ελίτ) και επαληθευμένη
                ταυτότητα μέσω Gov.gr για αποφυγή των bots.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium text-base">
                Πώς υποβάλλω μια πρόταση;
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Μετά την εγγραφή σας, μπορείτε να υποβάλλετε μια πρόταση επιλέγοντας «Νέα Πρόταση» από το μενού.
                Θα χρειαστεί να διατυπώσετε ένα συγκεκριμένο ερώτημα και μια προτεινόμενη λύση.
                Η πρόταση ανήκει σε μια θεματική κατηγορία και υποβάλλεται σε μια κοινότητα πολιτών
                (π.χ. γειτονιά, δήμος, επαγγελματικός κλάδος).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium text-base">
                Τι είναι η «Επικύρωση LLM» και γιατί την χρησιμοποιείτε;
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Πριν μπει σε διαβούλευση, κάθε πρόταση αξιολογείται αυτόματα από ένα μοντέλο γλωσσικής τεχνητής νοημοσύνης (LLM)
                σε πέντε άξονες: δομή, συγκεκριμενοποίηση, εφικτότητα, πληρότητα και διαφάνεια. Αυτό μειώνει
                το θόρυβο, εξασφαλίζει τη ποιότητα των προτάσεων πριν φτάσουν στην κοινότητα, και αυτοματοποιεί
                την πορεία για προτάσεις υψηλής ποιότητας.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium text-base">
                Τι είναι οι τροπολογίες και πώς λειτουργούν;
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Μετά την επικύρωση, τα μέλη της κοινότητας μπορούν να υποβάλλουν τροπολογίες — βελτιώσεις, προσθήκες ή αντιπροτάσεις
                στην αρχική πρόταση. Ο συγγραφέας διατηρεί το βέτο: μπορεί να τις αποδεχτεί (ενσωματώνοντάς τις στην πρόταση) ή να τις απορρίψει
                (με υποχρεωτική αιτιολόγηση). Αυτό διαφυλάττει τη συνοχή της πρότασης χωρίς να την υποβιβάζει η αρχή του πλήθους.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium text-base">
                Τι είναι το «Συμβουλή Κοινότητας»;
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Αν ο συγγραφέας απορρίψει μια τροπ3b9ότητα, η κοινότητα έχει την ευκαιρία να την «ακυρώσει» αυτή την απόρριψη. Μέσω up/down voting,
                η κοινότητα σήμαινει τις τροπολογίες που θεωρεί ότι αξίζουν να φτάσουν στο κληρωτό σώμα. Αυτός ο
                μηχανισμός εξισορροπεί τη δυνατή υπερβολή της εξουσίας του συγγραφέα — η κοινότητα έχει
                λόγο από το να την ακολουθήσει ακριβώς, μέχρι και να την απορρίψει.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium text-base">
                Τι είναι το «Κληρωτό Σώμα» και γιατί το χρησιμοποιείτε;
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Μετά την ανασκόπηση και τη συμβουλή, ένα τυχαία επιλεγμένο σώμα πολιτών (κλήρωση) αναλαμβάνει να συνθέσει το
                τελικό κείμενο της πρότασης. Η τυχαία επιλογή εξασφαλίζει αντιπροσωπευτικότητα
                χωρίς κομματικό έλεγχο. Δεν πρόκειται για επαγγελματίες ή εργοδότες — πρόκειται για τυχαίους πολίτες
                που αξιολογούν αντικειμενικά την πρόταση και τις τροπολογίες.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium text-base">
                Πώς λειτουργεί η ψηφοφορία επικύρωσης;
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Μετά τη σύνθεση του κληρωτού σώματος, το τελικό κείμενο τίθεται σε δυαδική ψηφοφορία Ναι/Όχι σε όλη την κοινότητα.
                Το αποτέλεσμα είναι διαφανές και απαιτείται υψηλό ποσοστό συμμετοχής για να θεωρηθεί η απόφαση νομιμοποιημένη.
                Κάθε ψηφοφόρος μπορεί να πιστοποιήσει την ταυτότητά του μέσω Gov.gr.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium text-base">
                Τι σημαίνει η ταυτοποίηση μέσω Gov.gr;
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Για να ψηφίσετε σε κρίσιμες ψηφοφορίες, ταυτοποιείστε την ταυτότητά σας μέσω του ελληνικού κράτους (Gov.gr ή
                κρυπτογραφική υπογραφή). Αυτό εξασφαλίζει ότι κάθε ψήφος προέρχεται από πραγματικό πολίτη και όχι από bot
                ή πολλαπλούς λογαριασμούς. Η ανωνυμία της ψήφου διατηρείται πλήρως — μόνο η ταυτότητα επαληθεύεται.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium text-base">
                Τι είναι οι Κοινότητες στην AgoraX;
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Οι κοινότητες είναι ομάδες πολιτών με κοινό ενδιαφέρον. Μπορεί να είναι γεωγραφική (π.χ. δήμος Αθηναίων),
                επαγγελματική (π.χ. ιατρικός σύλλογος) ή θεματική (π.χ. περιβάλλον). Κάθε πρόταση υποβάλλεται
                σε μια κοινότητα και οι ψήφοι μετρούν αποκλειστικά μέσα στην κοινότητα που την εκφράζει — χωρίς εξωτερικούς
                παρεμβαίνοντες.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium text-base">
                Πώς μπορώ να συμμετέχω σε κλήρωση;
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Τα μέλη της κοινότητας μπορούν να δηλώσουν ενδιαφέρον για συμμετοχή σε κλήρωση. Όταν μια πρόταση φτάσει στην φάση σύνθεσης,
                το σύστημα επιλέγει τυχαία ένα υποσύνολο πολιτών από όσους δήλωσαν ενδιαφέρον. Αν επιλεγείτε,
                λαμβάνετε ειδοποίηση και έχετε προθεσμία (π.χ. 48 ώρες) να υποβάλλετε την αξιολόγησή σας.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium text-base">
                Είναι δωρεάν η χρήση της AgoraX;
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Ναι, η βασική χρήση της πλατφόρμας είναι δωρεάν. Μπορείτε να εγγραφείτε, να υποβάλλετε προτάσεις, να συμμετέχετε σε κοινότητες
                και να ψηφίζετε χωρίς καμία οικονομική επιβάρυνση. Η πλατφόρμα χρηματοδοτείται από τις κοινότητες που τη χρησιμοποιούν
                για να οργανώσουν την προσωπική τους διαβούλευση.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-13" className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium text-base">
                Πώς επικοινωνώ με την ομάδα υποστήριξης;
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Για τεχνικά θέματα, ερωτήσεις ή προτάσεις σχετικά με την πλατφόρμα, μπορείτε να στείλετε email στο
                {" "}
                <a href="mailto:agoraxdemocracy@gmail.com" className="text-primary hover:underline">
                  agoraxdemocracy@gmail.com
                </a>.
                {" "}
                Αν επιθυμείτε να αποκτήσετε πρόσβαση στο demo ή να συζητήσετε συνεργασία, είμαστε ανοιχτοί.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-12 text-center p-8 bg-muted/30 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">Δεν βρήκατε την απάντησή σας;</h2>
            <p className="text-muted-foreground mb-6">
              Επισκεφθείτε την σελίδα για την προσωπική εξήγηση της διαδικασίας ή εγγραφείτε για να δείτε από κοντά.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/how-it-works")}>
                Πώς Λειτουργεί
              </Button>
              <Button onClick={() => navigate("/walkthrough")}>
                Διαδραστικό Walkthrough
              </Button>
              <Button variant="secondary" onClick={() => navigate("/auth?tab=register")}>
                Εγγραφή
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
