import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEY = {
  answers: 'tiq.answers',
  leadEmail: 'tiq.leadEmail',
  recommended: 'tiq.recommended',
  recommendationMatches: 'tiq.recommendationMatches',
  checkoutIds: 'tiq.checkoutProductIds',
  checkout: 'tiq.checkout',
  user: 'tiq.currentUser',
} as const;

export async function read<T>(k: string, f: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(k);
    return v ? JSON.parse(v) : f;
  } catch {
    return f;
  }
}

export async function write(k: string, v: any) {
  await AsyncStorage.setItem(k, JSON.stringify(v));
}

export async function remove(k: string) {
  await AsyncStorage.removeItem(k);
}
