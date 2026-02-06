import React from 'react';
import { AlertCircle, Clock, HelpCircle, Phone, Mail } from 'lucide-react';

interface ErrorStateProps {
  type: 'expired' | 'invalid' | 'not-found';
}

const ERROR_CONTENT = {
  expired: {
    icon: Clock,
    title: 'Link Expired',
    message: 'This tracking link has expired. Registration tracking links remain active for 30 days after your sticker is delivered.',
    showContact: true
  },
  invalid: {
    icon: AlertCircle,
    title: 'Invalid Link',
    message: 'This tracking link is not valid. Please check the link and try again, or contact us for assistance.',
    showContact: true
  },
  'not-found': {
    icon: HelpCircle,
    title: 'Registration Not Found',
    message: 'We couldn\'t find a registration matching this link. The order may have been removed or the link may be incorrect.',
    showContact: true
  }
};

export const ErrorState: React.FC<ErrorStateProps> = ({ type }) => {
  const content = ERROR_CONTENT[type];
  const Icon = content.icon;

  return (
    <div className="text-center py-16 px-4 max-w-md mx-auto">
      <div className="mb-4">
        <Icon
          className="mx-auto text-amber-500"
          size={48}
          strokeWidth={1.5}
        />
      </div>

      <h2 className="text-white text-xl font-display tracking-wide mb-2">
        {content.title}
      </h2>

      <p className="text-gray-400 mb-8 leading-relaxed">
        {content.message}
      </p>

      {content.showContact && (
        <div className="space-y-4 text-sm">
          <p className="text-gray-500">
            Questions? Contact Triple J Auto Investment:
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="tel:+17135550192"
              className="inline-flex items-center justify-center gap-2 text-tj-gold hover:text-white transition-colors"
            >
              <Phone size={14} />
              (713) 555-0192
            </a>
            <a
              href="mailto:registration@triplejautoinvestment.com"
              className="inline-flex items-center justify-center gap-2 text-tj-gold hover:text-white transition-colors"
            >
              <Mail size={14} />
              Email Us
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
