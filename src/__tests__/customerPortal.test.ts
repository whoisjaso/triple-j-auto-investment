import { describe, it, expect } from 'vitest';
import {
  encodeCustomerLink,
  decodeCustomerLink,
  encodeCompletedLink,
  decodeCompletedLink,
  type CustomerSection,
} from '@/lib/documents/customerPortal';
import type { BillOfSaleData } from '@/lib/documents/billOfSale';

const mockBillOfSaleData: BillOfSaleData = {
  saleDate: '2026-03-15',
  stockNumber: 'STK001',
  vehicleYear: '2020',
  vehicleMake: 'Toyota',
  vehicleModel: 'Camry',
  vehicleTrim: 'SE',
  vehicleVin: '1HGBH41JXMN109186',
  vehiclePlate: 'ABC1234',
  vehicleColor: 'Black',
  vehicleBodyStyle: 'Sedan',
  vehicleMileage: '45000',
  odometerReading: '45000',
  odometerStatus: 'actual',
  salePrice: 5000,
  tradeInAllowance: 0,
  tradeInDescription: '',
  tradeInVin: '',
  tradeInPayoff: 0,
  tax: 325,
  titleFee: 33,
  docFee: 150,
  registrationFee: 75,
  otherFees: 0,
  otherFeesDescription: '',
  paymentMethod: 'Cash',
  paymentMethodOther: '',
  conditionType: 'as_is',
  warrantyDuration: '',
  warrantyDescription: '',
  buyerName: '',
  buyerAddress: '',
  buyerCity: '',
  buyerState: '',
  buyerZip: '',
  buyerPhone: '',
  buyerEmail: '',
  buyerLicense: '',
  buyerLicenseState: '',
  coBuyerName: '',
  coBuyerAddress: '',
  coBuyerCity: '',
  coBuyerState: '',
  coBuyerZip: '',
  coBuyerPhone: '',
  coBuyerEmail: '',
  coBuyerLicense: '',
  coBuyerLicenseState: '',
};

describe('encodeCustomerLink / decodeCustomerLink', () => {
  it('round-trips bill of sale data', () => {
    const link = encodeCustomerLink('billOfSale', mockBillOfSaleData, 'https://thetriplejauto.com');
    expect(link).toContain('https://thetriplejauto.com/documents/portal#customer/');

    const hash = '#customer/' + link.split('#customer/')[1];
    const decoded = decodeCustomerLink(hash);
    expect(decoded).not.toBeNull();
    expect(decoded!.s).toBe('billOfSale');
    expect(decoded!.d.vehicleVin).toBe('1HGBH41JXMN109186');
    expect(decoded!.d.salePrice).toBe(5000);
    expect(decoded!.d.vehicleYear).toBe('2020');
  });

  it('includes dealer signature when provided', () => {
    const link = encodeCustomerLink('billOfSale', mockBillOfSaleData, 'https://test.com', 'sig-data', '2026-03-15');
    const hash = '#customer/' + link.split('#customer/')[1];
    const decoded = decodeCustomerLink(hash);
    expect(decoded!.ds).toBe('sig-data');
    expect(decoded!.dd).toBe('2026-03-15');
  });

  it('excludes buyer-only fields from dealer link', () => {
    const link = encodeCustomerLink('billOfSale', mockBillOfSaleData, 'https://test.com');
    const hash = '#customer/' + link.split('#customer/')[1];
    const decoded = decodeCustomerLink(hash);
    expect(decoded!.d.buyerName).toBeUndefined();
    expect(decoded!.d.buyerPhone).toBeUndefined();
    expect(decoded!.d.buyerEmail).toBeUndefined();
  });

  it('returns null for invalid hash', () => {
    expect(decodeCustomerLink('#invalid/garbage')).toBeNull();
    expect(decodeCustomerLink('')).toBeNull();
    expect(decodeCustomerLink('#customer/')).toBeNull();
  });
});

describe('encodeCompletedLink / decodeCompletedLink', () => {
  it('round-trips with acknowledgments', () => {
    const dealerData = { vehicleVin: '1HGBH41JXMN109186', salePrice: 5000 };
    const customerData = { buyerName: 'John Doe', buyerPhone: '832-555-1234' };
    const acks = {
      inspected: true,
      asIs: true,
      receivedCopy: true,
      allSalesFinal: true,
      odometerInformed: true,
      responsibility: true,
      financingSeparate: false,
    };

    const link = encodeCompletedLink(
      'billOfSale', dealerData, customerData, 'https://test.com',
      'dealer-sig', '2026-03-15',
      'buyer-sig', '2026-03-15',
      undefined, undefined,
      undefined,
      acks,
    );

    expect(link).toContain('#completed/');
    const hash = '#completed/' + link.split('#completed/')[1];
    const decoded = decodeCompletedLink(hash);

    expect(decoded).not.toBeNull();
    expect(decoded!.s).toBe('billOfSale');
    expect(decoded!.dd.vehicleVin).toBe('1HGBH41JXMN109186');
    expect(decoded!.cd.buyerName).toBe('John Doe');
    expect(decoded!.ds).toBe('dealer-sig');
    expect(decoded!.bs).toBe('buyer-sig');
    expect(decoded!.ack).toBeDefined();
    expect(decoded!.ack!.inspected).toBe(true);
    expect(decoded!.ack!.financingSeparate).toBe(false);
  });

  it('returns null for invalid completed hash', () => {
    expect(decodeCompletedLink('#completed/')).toBeNull();
    expect(decodeCompletedLink('#customer/something')).toBeNull();
    expect(decodeCompletedLink('')).toBeNull();
  });

  it('omits signatures that exceed size limits', () => {
    const hugeSig = 'x'.repeat(60000);
    const link = encodeCompletedLink(
      'billOfSale', {}, {}, 'https://test.com',
      hugeSig, '2026-03-15',
    );
    const hash = '#completed/' + link.split('#completed/')[1];
    const decoded = decodeCompletedLink(hash);
    expect(decoded!.ds).toBeUndefined();
  });

  it('works for all document types', () => {
    const sections: CustomerSection[] = ['financing', 'rental', 'billOfSale', 'form130U'];
    for (const section of sections) {
      const link = encodeCompletedLink(section, { foo: 'bar' }, { baz: 'qux' }, 'https://test.com');
      const hash = '#completed/' + link.split('#completed/')[1];
      const decoded = decodeCompletedLink(hash);
      expect(decoded!.s).toBe(section);
    }
  });
});
