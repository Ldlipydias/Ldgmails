import { useState, useEffect, Component, ReactNode } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { 
  auth, 
  onAuthStateChanged, 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  Timestamp,
  FirebaseUser
} from './firebase';
import { UserProfile } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { motion, AnimatePresence } from 'motion/react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-bold text-red-900">Ops! Algo deu errado.</h1>
            <p className="text-red-700 text-sm">Ocorreu um erro inesperado na aplicação.</p>
            <pre className="bg-red-100 p-4 rounded-xl text-[10px] text-left overflow-auto max-h-40">
              {this.state.error?.message || String(this.state.error)}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-900 text-white rounded-xl font-bold"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  console.log("App component rendering...");
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    console.log("App useEffect running...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email || "No user");
      setLoading(true);
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          // Ensure profile exists in Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              createdAt: serverTimestamp() as Timestamp,
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          } else {
            setProfile(userSnap.data() as UserProfile);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Error in auth state change:", err);
        toast.error("Erro ao carregar perfil do usuário.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-800 rounded-full"
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-neutral-200">
        <Toaster position="bottom-center" />
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-screen flex items-center justify-center p-4"
            >
              <Auth />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Dashboard user={user} profile={profile} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
