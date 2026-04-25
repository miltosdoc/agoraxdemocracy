import { Link } from "wouter";
import { useTranslation } from "@/hooks/use-translation";
import logoImage from "../../assets/logo.png";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Tagline */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src={logoImage} alt="AgoraX" className="h-8 w-auto" />
              <span className="text-white text-xl font-bold">AgoraX</span>
            </Link>
            <p className="text-sm text-slate-400">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.usefulLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">{t('footer.howItWorks')}</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">{t('footer.faq')}</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.contact')}</h3>
            <p className="text-sm text-slate-400">info@agorax.gr</p>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} AgoraX — {t('general.digitalDemocracy')}
        </div>
      </div>
    </footer>
  );
}
