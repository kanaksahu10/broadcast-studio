import { useState } from 'react';

export type UserRole = 'super-admin' | 'executive-approver';

export interface UserIdentity {
  name: string;
  initials: string;
  /** Avatar background — one identity per role so the chrome reads as a different person. */
  avatarColor: string;
}

// This prototype has no real accounts, so each role stands in for one named person.
const USER_IDENTITIES: Record<UserRole, UserIdentity> = {
  'super-admin': { name: 'John Doe', initials: 'JD', avatarColor: '#3eb361' },
  'executive-approver': { name: 'Jennifer James', initials: 'JJ', avatarColor: '#8E44AD' },
};

export function getUserIdentity(role: UserRole): UserIdentity {
  return USER_IDENTITIES[role];
}

/**
 * Role lives in the URL so a given perspective is linkable and survives reload.
 * Owned by <BroadcastStudio> and passed down, so the chrome (sidebar, top bar)
 * and the dashboard always agree on who is viewing.
 */
export function useRole(): [UserRole, (next: UserRole) => void] {
  const [role, setRoleState] = useState<UserRole>(() => {
    const param = new URLSearchParams(window.location.search).get('role');
    return param === 'executive-approver' ? 'executive-approver' : 'super-admin';
  });

  const setRole = (next: UserRole) => {
    setRoleState(next);
    const url = new URL(window.location.href);
    if (next === 'super-admin') url.searchParams.delete('role');
    else url.searchParams.set('role', next);
    window.history.replaceState({}, '', url.toString());
  };

  return [role, setRole];
}
