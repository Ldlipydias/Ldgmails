import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
}

export interface Alias {
  id: string;
  userId: string;
  aliasEmail: string;
  targetEmail: string;
  label: string;
  createdAt: Timestamp;
  isActive: boolean;
  description?: string;
}

export interface Message {
  id: string;
  aliasEmail: string;
  from: string;
  subject: string;
  body: string;
  createdAt: Timestamp;
}
