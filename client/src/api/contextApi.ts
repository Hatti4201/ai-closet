import api from './authApi';

export interface ContextInfo {
  date: string;
  season: string;
  weather: { tempC: number; condition: string };
}

export const contextApi = {
  get: (lat: number, lon: number): Promise<ContextInfo> =>
    api.get<ContextInfo>(`/context?lat=${lat}&lon=${lon}`).then((r) => r.data),
};
