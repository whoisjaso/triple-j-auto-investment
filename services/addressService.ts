import { AddressSuggestion } from '../types';

const PHOTON_API_URL = 'https://photon.komoot.io/api/';

export const searchAddresses = async (query: string): Promise<AddressSuggestion[]> => {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `${PHOTON_API_URL}?q=${encodeURIComponent(query)}&limit=5&lang=en`
    );

    if (!response.ok) {
      throw new Error('Address search failed');
    }

    const data = await response.json();

    return data.features.map((feature: any, index: number) => {
      const props = feature.properties;
      const parts = [];

      if (props.housenumber) parts.push(props.housenumber);
      if (props.street) parts.push(props.street);
      if (props.city) parts.push(props.city);
      if (props.state) parts.push(props.state);
      if (props.postcode) parts.push(props.postcode);
      if (props.country) parts.push(props.country);

      return {
        display_name: parts.join(', ') || props.name || 'Unknown Address',
        place_id: index
      };
    });
  } catch (error) {
    console.error('Address search error:', error);
    return [];
  }
};
