// src/utils/generateApiKey.ts
import { customAlphabet } from 'nanoid';

// lowercase letters + digits
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * @param orgName  The org prefix (e.g. 'acme')
 * @returns        A 20-char key like 'acme9x4k2j8s1b7w3q0r'
 */
export function generateApiKey(orgName: string): string {
  // make sure prefix isn’t longer than 19 chars
  const prefix = orgName.slice(0, 19);
  const randomLength = 20 - prefix.length;
  const nanoid = customAlphabet(ALPHABET, randomLength);
  return `${prefix}${nanoid()}`;
}
