import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db, doc, getDoc, setDoc, query, collection, where, limit, getDocs, serverTimestamp } from './lib/firebase';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Inventory from './components/Inventory';
import Cashier from './components/Cashier';
import Rentals from './components/Rentals';
import Clients from './components/Clients';
import Sales from './components/Sales';
import Reports from './components/Reports';
import Deliveries from './components/Deliveries';
import Quotes from './components/Quotes';
import Layout from './components/Layout';
import PWAUpdater from './components/PWAUpdater';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<'admin' | 'funcionario' | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          // MODO TESTE TOTAL: QUALQUER USUÁRIO É ADMIN
          const currentBusinessId = firebaseUser.uid;
          setBusinessId(currentBusinessId);

          const userRef = doc(db, 'usuarios', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            // Atualizar tipo para admin automaticamente se não for
            if (userData.tipo !== 'admin') {
              await setDoc(userRef, { tipo: 'admin' }, { merge: true });
            }
            setRole('admin');
          } else {
            // Novo usuário sempre admin
            const profileData = {
              nome: firebaseUser.displayName || 'ADMINISTRADOR TESTE',
              email: firebaseUser.email,
              tipo: 'admin',
              ativo: true,
              criadoEm: serverTimestamp(),
              lastLogin: serverTimestamp()
            };
            await setDoc(userRef, profileData);
            setRole('admin');
          }
        } catch (error) {
          console.error("Erro crítico no perfil (Teste Mode):", error);
          setRole('admin'); // Segurança de fallback para teste
          setBusinessId(firebaseUser.uid);
        }
      } else {
        setUser(null);
        setRole(null);
        setBusinessId(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-brand-gold">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4" />
          <h1 className="text-xl font-bold tracking-widest text-brand-silver uppercase">ESKINÃO SERV FEST 2</h1>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <PWAUpdater />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          
          <Route element={user ? <Layout user={user} role={role} /> : <Navigate to="/login" />}>
            <Route path="/" element={<Cashier role={role} businessId={businessId} />} />
            <Route path="/dashboard" element={<Dashboard role={role} businessId={businessId} />} />
            <Route path="/entregas" element={<Deliveries role={role} businessId={businessId} />} />
            <Route path="/vendas" element={<Sales role={role} businessId={businessId} />} />
            <Route path="/clientes" element={<Clients role={role} businessId={businessId} />} />
            <Route path="/estoque" element={<Inventory role={role} businessId={businessId} />} />
            <Route path="/caixa" element={<Cashier role={role} businessId={businessId} />} />
            <Route path="/alugueis" element={<Rentals role={role} businessId={businessId} />} />
            <Route path="/orcamentos" element={<Quotes role={role} businessId={businessId} />} />
            <Route path="/relatorios" element={<Reports role={role} businessId={businessId} />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}
