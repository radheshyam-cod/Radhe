import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@/lib/store';

import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { setAuth, setProfile } = useStore();
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const userData = await res.json();
            // Construct session object
            const sessionData: any = { access_token: token, user: { id: userData.id } };
            setSession(sessionData);
            setUser({ id: userData.id } as User);
            setAuth({ id: userData.id } as User, sessionData);
            setProfile(userData);
          } else {
            // Token invalid
            localStorage.removeItem('access_token');
          }
        } catch (e) {
          console.error("Auth check failed", e);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [setAuth, setProfile]);

  const signOut = async () => {
    localStorage.removeItem('access_token');
    setSession(null);
    setUser(null);
    setProfile(null);
    setAuth(null, null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
