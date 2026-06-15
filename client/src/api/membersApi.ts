import api from './authApi';

export interface Member {
  id: string;
  householdId: string;
  displayName: string;
  role?: 'self' | 'partner' | 'child' | 'other';
}

export const membersApi = {
  getAll: (): Promise<Member[]> => api.get<Member[]>('/members').then((r) => r.data),
};
