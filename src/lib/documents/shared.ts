export const DEALER_NAME = 'Triple J Auto Investment LLC';
export const DEALER_ADDRESS = '8774 Almeda Genoa Road, Houston, Texas 77075';
export const DEALER_PHONE = '(281) 253-3602';
export const DEALER_WEBSITE = 'thetriplejauto.com';
export const DEALER_LICENSE = 'P171632';

export interface SignatureData {
  buyerIdPhoto: string;
  buyerSignature: string;
  buyerSignatureDate: string;
  coBuyerSignature: string;
  coBuyerSignatureDate: string;
  dealerSignature: string;
  dealerSignatureDate: string;
}

export const emptySignatures: SignatureData = {
  buyerIdPhoto: '',
  buyerSignature: '',
  buyerSignatureDate: '',
  coBuyerSignature: '',
  coBuyerSignatureDate: '',
  dealerSignature: '',
  dealerSignatureDate: '',
};
