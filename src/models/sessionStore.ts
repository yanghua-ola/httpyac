import { UserSession } from './userSession.js';

export interface SessionStore {
  reset(): Promise<void>;
  getUserSession(id: string): UserSession | undefined;
  setUserSession(userSession: UserSession): void;
  removeUserSession(id: string): void;
}