import { initializeApp, type FirebaseApp } from '@firebase/app';
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
  sendEmailVerification,
  reload,
  deleteUser,
  type Auth,
  type User,
} from '@firebase/auth';
import {
  getDatabase,
  ref,
  set,
  remove,
  onValue,
  type Database,
  type Unsubscribe,
} from '@firebase/database';
import type { Person } from '../types/notebook';
import { normalizePeople } from '../utils/storage';
import {
  ADMIN_UID,
  isAdminUid,
  parseGlobalAiConfig,
  type GlobalAiConfig,
} from '../utils/aiPolicy';

export const firebaseConfig = {
  apiKey: 'AIzaSyCZzb83vFUDEruoR4KMFBG-7CVnyBwkRDc',
  authDomain: 'friends-37e97.firebaseapp.com',
  databaseURL: 'https://friends-37e97-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'friends-37e97',
  storageBucket: 'friends-37e97.firebasestorage.app',
  messagingSenderId: '725885022606',
  appId: '1:725885022606:web:95c1c23509a935b6f4f4df',
  measurementId: 'G-LJ13FV5HZN',
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Database | null = null;

export function getFirebaseServices(): { app: FirebaseApp; auth: Auth; db: Database } {
  if (!appInstance) {
    appInstance = initializeApp(firebaseConfig);
    dbInstance = getDatabase(appInstance);
    authInstance = initializeAuth(appInstance, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        inMemoryPersistence,
      ],
    });
  }
  return {
    app: appInstance,
    auth: authInstance!,
    db: dbInstance!,
  };
}

export function transliterateLogin(str: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y',
    ь: '', э: 'e', ю: 'yu', я: 'ya', ә: 'a', ғ: 'g', қ: 'q', ң: 'n', ө: 'o', ұ: 'u', ү: 'u', һ: 'h', і: 'i',
  };
  return String(str || '')
    .toLowerCase()
    .split('')
    .map((ch) => (map[ch] !== undefined ? map[ch] : ch))
    .join('');
}

export function normalizeLoginToEmail(rawLogin: string): string {
  const clean = String(rawLogin || '').trim().toLowerCase();
  if (!clean) return '';
  if (clean.includes('@')) return clean;
  const latin = transliterateLogin(clean).replace(/[^a-z0-9._-]/g, '_');
  return `${latin || 'user'}@notebook.app`;
}

export function isSyntheticLoginEmail(email?: string | null): boolean {
  if (!email) return true;
  return email.toLowerCase().endsWith('@notebook.app');
}

export function getUserDisplayLabel(user: User | null): string {
  if (!user) return 'Гость (локально)';
  if (user.displayName && user.displayName.trim()) return user.displayName.trim();
  const email = user.email || '';
  if (email.endsWith('@notebook.app')) {
    return email.replace('@notebook.app', '');
  }
  return email.split('@')[0] || 'Пользователь';
}

export function getHumanFirebaseAuthError(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  const code = (e && e.code) || '';
  const suffix = code ? ` [${code}]` : '';

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return `Неверный логин/Email или пароль. Проверьте данные и попробуйте снова.${suffix}`;
  }
  if (code === 'auth/email-already-in-use') {
    return `Этот логин или Email уже занят. Попробуйте другой или войдите в аккаунт.${suffix}`;
  }
  if (code === 'auth/weak-password') {
    return `Пароль слишком короткий — введите минимум 6 символов.${suffix}`;
  }
  if (code === 'auth/invalid-email') {
    return `Некорректный формат логина или Email.${suffix}`;
  }
  if (code === 'auth/requires-recent-login') {
    return `Требуется подтверждение входа. Введите текущий пароль ещё раз.${suffix}`;
  }
  if (code === 'auth/operation-not-allowed') {
    return `Операция не разрешена в настройках Firebase Console Authentication.${suffix}`;
  }
  if (code === 'auth/too-many-requests') {
    return `Слишком много попыток. Подождите пару минут и повторите.${suffix}`;
  }
  if (code === 'auth/network-request-failed') {
    return `Нет соединения с сервером Firebase. Проверьте интернет.${suffix}`;
  }
  return `Ошибка авторизации: ${e && e.message ? e.message : 'неизвестная ошибка'}${suffix}`;
}

export async function loginWithLoginOrEmail(rawLogin: string, password: string) {
  const { auth } = getFirebaseServices();
  const email = normalizeLoginToEmail(rawLogin);
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithLoginOrEmail(
  rawLogin: string,
  password: string,
  displayName: string
) {
  const { auth } = getFirebaseServices();
  const email = normalizeLoginToEmail(rawLogin);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const finalName =
    displayName.trim() || (rawLogin.includes('@') ? rawLogin.split('@')[0] : rawLogin.trim());
  if (cred.user && finalName) {
    await updateProfile(cred.user, { displayName: finalName }).catch(() => {});
  }
  return cred;
}

export async function logoutFromFirebase() {
  const { auth } = getFirebaseServices();
  return signOut(auth);
}

export async function sendPasswordResetForEmail(emailInput: string): Promise<void> {
  const clean = emailInput.trim().toLowerCase();
  if (!clean.includes('@') || isSyntheticLoginEmail(clean)) {
    throw new Error(
      'Введите реальный Email, который привязан к аккаунту (короткий логин без почты не принимает письма).'
    );
  }
  const { auth } = getFirebaseServices();
  auth.languageCode = 'ru';
  await sendPasswordResetEmail(auth, clean);
}

export async function bindRealEmailToUser(
  user: User,
  newEmailInput: string,
  currentPassword: string
): Promise<{ email: string }> {
  const cleanEmail = newEmailInput.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || isSyntheticLoginEmail(cleanEmail)) {
    throw new Error('Укажите настоящий Email адрес (например: name@gmail.com).');
  }
  if (!user.email) {
    throw new Error('У текущего аккаунта отсутствует базовый идентификатор для проверки пароля.');
  }

  const { auth, db } = getFirebaseServices();
  auth.languageCode = 'ru';

  // Re-authenticate with current credentials before updating/verifying new email
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  await verifyBeforeUpdateEmail(user, cleanEmail);

  // Record pendingEmail in RTDB user profile for UX visibility
  await set(ref(db, `users/${user.uid}/profile`), {
    displayName: getUserDisplayLabel(user),
    email: user.email,
    pendingEmail: cleanEmail,
    lastSeen: new Date().toISOString(),
  }).catch(() => {});

  return { email: cleanEmail };
}

export async function deleteCurrentUserAccount(
  user: User,
  currentPassword: string,
  onBeforeCloudWipe?: () => void
): Promise<void> {
  if (!currentPassword) {
    throw new Error('Введите текущий пароль для подтверждения удаления аккаунта.');
  }
  if (!user.email) {
    throw new Error('У текущего аккаунта отсутствует базовый идентификатор для проверки пароля.');
  }

  const { db } = getFirebaseServices();
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  // Stop active RTDB listeners before deleting cloud data
  onBeforeCloudWipe?.();

  // Delete cloud data while auth credentials are still valid, then delete Auth account
  await remove(ref(db, `users/${user.uid}`));
  await deleteUser(user);
}

export async function resendVerificationForUser(user: User): Promise<void> {
  const { auth } = getFirebaseServices();
  auth.languageCode = 'ru';
  await sendEmailVerification(user);
}

export async function reloadFirebaseUser(user: User): Promise<{
  emailVerified: boolean;
  email: string | null;
  requiresRelogin?: boolean;
}> {
  try {
    await reload(user);
    await user.getIdToken(true).catch(() => {});
    return {
      emailVerified: Boolean(user.emailVerified),
      email: user.email || null,
      requiresRelogin: false,
    };
  } catch (err) {
    const code = (err as { code?: string } | null)?.code || '';
    if (code === 'auth/user-token-expired' || code === 'auth/invalid-user-token') {
      return {
        emailVerified: false,
        email: user.email || null,
        requiresRelogin: true,
      };
    }
    throw err;
  }
}

export function subscribeAuthChanges(cb: (user: User | null) => void): Unsubscribe {
  const { auth } = getFirebaseServices();
  return onAuthStateChanged(auth, cb);
}

export async function updateUserProfileInCloud(user: User): Promise<void> {
  const { db } = getFirebaseServices();
  await set(ref(db, `users/${user.uid}/profile`), {
    displayName: getUserDisplayLabel(user),
    email: user.email || '',
    emailVerified: Boolean(user.emailVerified),
    lastSeen: new Date().toISOString(),
  });
}

// Targeted per-person cloud write: prevents overwriting changes made from another device!
export async function savePersonToCloud(uid: string, person: Person): Promise<void> {
  const { db } = getFirebaseServices();
  const cleanPerson = JSON.parse(JSON.stringify(person));
  await set(ref(db, `users/${uid}/people/${person.id}`), cleanPerson);
}

export async function deletePersonFromCloud(uid: string, personId: string): Promise<void> {
  const { db } = getFirebaseServices();
  await remove(ref(db, `users/${uid}/people/${personId}`));
}

export async function syncPeopleMapToCloud(uid: string, people: Person[]): Promise<void> {
  const { db } = getFirebaseServices();
  const mapObj: Record<string, Person> = {};
  for (const p of people) {
    mapObj[p.id] = JSON.parse(JSON.stringify(p));
  }
  await set(ref(db, `users/${uid}/people`), mapObj);
}

export function subscribeUserPeople(
  uid: string,
  onData: (people: Person[], hadData: boolean) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const { db } = getFirebaseServices();
  const peopleRef = ref(db, `users/${uid}/people`);

  return onValue(
    peopleRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData([], false);
        return;
      }
      const rawVal = snapshot.val();
      const people = normalizePeople(rawVal);

      // Migrate legacy array-indexed RTDB storage ("0", "1") once to ID-keyed map
      // so concurrent multi-device edits never overwrite different people or collide on numeric keys.
      const needsKeyMigration =
        Array.isArray(rawVal) ||
        (rawVal &&
          typeof rawVal === 'object' &&
          Object.keys(rawVal).some((k) => /^\d+$/.test(k)));

      if (needsKeyMigration && people.length > 0) {
        syncPeopleMapToCloud(uid, people).catch(() => {});
      }

      onData(people, true);
    },
    (err) => {
      onError(err);
    }
  );
}

export function isAdminUser(user: User | null): boolean {
  return Boolean(user && isAdminUid(user.uid, ADMIN_UID));
}

export async function getFreshIdToken(user: User | null): Promise<string | null> {
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}

export function subscribeGlobalAiConfig(
  onData: (config: GlobalAiConfig) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const { db } = getFirebaseServices();
  const cfgRef = ref(db, 'appConfig/aiSettings');
  return onValue(
    cfgRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData({ sharedAiEnabled: true });
        return;
      }
      onData(parseGlobalAiConfig(snapshot.val()));
    },
    (err) => {
      onError?.(err);
    }
  );
}

export async function setGlobalAiEnabledInCloud(
  user: User,
  sharedAiEnabled: boolean
): Promise<void> {
  const { db } = getFirebaseServices();
  await set(ref(db, 'appConfig/aiSettings'), {
    sharedAiEnabled,
    updatedAt: new Date().toISOString(),
    updatedBy: user.uid,
  });
}
