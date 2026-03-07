import React from 'react';
import { Vehicle, VehicleStatus } from '../types';

interface VehicleJsonLdProps {
  vehicle: Vehicle;
}

export const VehicleJsonLd: React.FC<VehicleJsonLdProps> = ({ vehicle }) => {
  const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const description = vehicle.identityHeadline || vehicle.description;
  const availability =
    vehicle.status === VehicleStatus.AVAILABLE
      ? 'https://schema.org/InStock'
      : 'https://schema.org/SoldOut';

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'Car',
    name,
    description,
    brand: {
      '@type': 'Brand',
      name: vehicle.make,
    },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    itemCondition: 'https://schema.org/UsedCondition',
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: vehicle.mileage,
      unitCode: 'SMI',
    },
    vehicleIdentificationNumber: vehicle.vin,
    offers: {
      '@type': 'Offer',
      availability,
      price: vehicle.price,
      priceCurrency: 'USD',
      seller: {
        '@type': 'AutoDealer',
        name: 'Triple J Auto Investment',
        telephone: '(832) 400-9760',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '8774 Almeda Genoa Rd',
          addressLocality: 'Houston',
          addressRegion: 'TX',
          postalCode: '77075',
        },
      },
    },
  };

  // Conditional fields -- only include when values exist
  if (vehicle.imageUrl) {
    jsonLd.image = vehicle.imageUrl;
  }

  if (vehicle.slug) {
    jsonLd.url = `https://triplejautoinvestment.com/vehicles/${vehicle.slug}`;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};
