import type { FamilyMember, FamilyRelation } from '../types';

const MEMBERS_KEY = 'raizes_family_members_v1';
const RELATIONS_KEY = 'raizes_family_relations_v1';
const HISTORY_KEY = 'raizes_prompt_history_v1';
const API_KEY_STORAGE = 'raizes_groq_api_key';

export const storageService = {
  loadMembers(): FamilyMember[] {
    try {
      const data = localStorage.getItem(MEMBERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load family members from localStorage', e);
      return [];
    }
  },

  saveMembers(members: FamilyMember[]): void {
    try {
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
    } catch (e) {
      console.error('Failed to save family members to localStorage', e);
    }
  },

  loadRelations(): FamilyRelation[] {
    try {
      const data = localStorage.getItem(RELATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load relations from localStorage', e);
      return [];
    }
  },

  saveRelations(relations: FamilyRelation[]): void {
    try {
      localStorage.setItem(RELATIONS_KEY, JSON.stringify(relations));
    } catch (e) {
      console.error('Failed to save relations to localStorage', e);
    }
  },

  loadHistory(): string[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveHistory(history: string[]): void {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  },

  clearAll(): void {
    localStorage.removeItem(MEMBERS_KEY);
    localStorage.removeItem(RELATIONS_KEY);
    localStorage.removeItem(HISTORY_KEY);
  },

  getCustomApiKey(): string {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  },

  setCustomApiKey(key: string): void {
    if (key.trim()) {
      localStorage.setItem(API_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
    }
  },
};
