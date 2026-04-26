import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Share2, Copy, Check } from "lucide-react";
import { useShare } from "@/hooks/use-share";
import { useTranslation } from "@/hooks/use-translation";
import { FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp, FaTelegram } from "react-icons/fa";

interface ShareButtonProps {
  pollId: number;
  pollTitle: string;
  pollDescription?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function ShareButtonNew({ 
  pollId, 
  pollTitle, 
  pollDescription, 
  variant = "outline",
  size = "default",
  className 
}: ShareButtonProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const share = useShare();

  const handleCopyLink = async () => {
    const success = await share.copyLink(pollId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    await share.nativeShare({
      pollId,
      title: pollTitle,
      description: pollDescription,
    });
  };

  // If native share is available, use it directly
  if (share.canNativeShare) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleNativeShare}
        data-testid="button-share"
      >
        <Share2 className="h-4 w-4" />
        {size !== "icon" && t("Share")}
      </Button>
    );
  }

  // Otherwise, show dropdown with all options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          data-testid="button-share"
        >
          <Share2 className="h-4 w-4" />
          {size !== "icon" && t("Share")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={handleCopyLink}
          data-testid="menu-item-copy-link"
        >
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-600" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {copied ? t("Link copied!") : t("Copy link")}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => share.shareOnTwitter({ pollId, title: pollTitle })}
          data-testid="menu-item-twitter"
        >
          <FaTwitter className="h-4 w-4 mr-2 text-[#1DA1F2]" />
          Twitter/X
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => share.shareOnFacebook({ pollId, title: pollTitle })}
          data-testid="menu-item-facebook"
        >
          <FaFacebook className="h-4 w-4 mr-2 text-[#1877F2]" />
          Facebook
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => share.shareOnLinkedIn({ pollId, title: pollTitle })}
          data-testid="menu-item-linkedin"
        >
          <FaLinkedin className="h-4 w-4 mr-2 text-[#0A66C2]" />
          LinkedIn
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => share.shareOnWhatsApp({ pollId, title: pollTitle })}
          data-testid="menu-item-whatsapp"
        >
          <FaWhatsapp className="h-4 w-4 mr-2 text-[#25D366]" />
          WhatsApp
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => share.shareOnTelegram({ pollId, title: pollTitle })}
          data-testid="menu-item-telegram"
        >
          <FaTelegram className="h-4 w-4 mr-2 text-[#0088cc]" />
          Telegram
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
