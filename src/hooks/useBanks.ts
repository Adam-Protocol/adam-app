import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type Bank = {
  id: number;
  code: string;
  name: string;
};

/**
 * Fetch list of banks for a specific country
 */
export function useBanks(country: string = 'NG') {
  return useQuery({
    queryKey: ['banks', country],
    queryFn: async () => {
      console.log(`Fetching banks for ${country}...`);
      const response = await axios.get(`${API}/offramp/banks/${country}`);
      console.log(`Received ${response.data?.length || 0} banks`);
      // Backend returns array directly
      return response.data as Bank[];
    },
    enabled: !!country, // Only fetch if country is defined
    staleTime: 1000 * 60 * 60, // 1 hour - banks don't change often
    retry: 2,
  });
}
