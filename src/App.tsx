import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db, doc, getDoc, setDoc, query, collection, where, limit, getDocs } from './lib/firebase';
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
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<'admin' | 'funcionario' | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          const adminEmail = 'eskinaoservefest@gmail.com';
          const isMainAdmin = firebaseUser.email?.toLowerCase() === adminEmail;

          // Find business master ID (admin's UID)
          if (isMainAdmin) {
            setBusinessId(firebaseUser.uid);
          } else {
            const adminQuery = query(collection(db, 'usuarios'), where('email', '==', adminEmail), limit(1));
            const adminSnap = await getDocs(adminQuery);
            if (!adminSnap.empty) {
              setBusinessId(adminSnap.docs[0].id);
            } else {
              // Admin not found in DB yet, fallback to own UID if no admin exists
              // This ensures new users can still operate basic features if the admin haven't logged in yet
              // but restricted to their own data
              setBusinessId(firebaseUser.uid);
            }
          }
          
          const userRef = doc(db, 'usuarios', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setRole(userSnap.data().tipo);
            // Ensure admin stays admin even if manually changed in DB incorrectly
            if (isMainAdmin && userSnap.data().tipo !== 'admin') {
              await setDoc(userRef, { ...userSnap.data(), tipo: 'admin' }, { merge: true });
              setRole('admin');
            }
          } else {
            const newTipo = isMainAdmin ? 'admin' : 'funcionario';
            await setDoc(userRef, {
              nome: firebaseUser.displayName || (isMainAdmin ? 'ADMINISTRADOR' : 'FUNCIONÁRIO'),
              email: firebaseUser.email,
              tipo: newTipo,
              criadoEm: new Date().toISOString(),
              ativo: true
            });
            setRole(newTipo);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole('funcionario');
        }
      } else {
        setUser(null);
        setRole(null);
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
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          
          <Route element={user ? <Layout user={user} role={role} /> : <Navigate to="/login" />}>
            <Route path="/" element={<Dashboard role={role} businessId={businessId} />} />
            <Route path="/entregas" element={<Deliveries role={role} businessId={businessId} />} />
            <Route path="/vendas" element={<Sales role={role} businessId={businessId} />} />
            <Route path="/clientes" element={<Clients role={role} businessId={businessId} />} />
            <Route path="/estoque" element={<Inventory role={role} businessId={businessId} />} />
            
            {role === 'admin' && (
              <>
                <Route path="/caixa" element={<Cashier role={role} businessId={businessId} />} />
                <Route path="/alugueis" element={<Rentals role={role} businessId={businessId} />} />
                <Route path="/orcamentos" element={<Quotes role={role} businessId={businessId} />} />
                <Route path="/relatorios" element={<Reports role={role} businessId={businessId} />} />
              </>
            )}
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}
