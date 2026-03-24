import React, { useState, useEffect } from 'react';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  limit,
  signOut, 
  auth, 
  FirebaseUser,
  setDoc,
  doc,
  serverTimestamp,
  Timestamp
} from '../firebase';
import { Alias, UserProfile } from '../types';
import { 
  LogOut, 
  Plus, 
  Mail, 
  ShieldCheck, 
  Copy, 
  Trash2, 
  Power, 
  Search, 
  Filter, 
  ArrowRight,
  ChevronRight,
  User as UserIcon,
  Settings,
  Bell,
  ExternalLink,
  Download,
  RefreshCw,
  Zap,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import Inbox from './Inbox';

interface DashboardProps {
  user: FirebaseUser;
  profile: UserProfile | null;
}

export default function Dashboard({ user, profile }: DashboardProps) {
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newAliasLabel, setNewAliasLabel] = useState('');
  const [selectedAlias, setSelectedAlias] = useState<Alias | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);

  useEffect(() => {
    const isAdmin = user.email === 'kakaxe188@gmail.com';
    let q;
    if (isAdmin) {
      q = query(collection(db, 'webhook_logs'), orderBy('timestamp', 'desc'), limit(10));
    } else {
      q = query(collection(db, 'webhook_logs'), where('userId', '==', user.uid), limit(20));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      if (!isAdmin) {
        logs = logs.sort((a, b) => {
          const tA = a.timestamp?.toMillis?.() || 0;
          const tB = b.timestamp?.toMillis?.() || 0;
          return tB - tA;
        }).slice(0, 10);
      }
      setDebugLogs(logs);
    }, (err) => console.error("Debug logs error:", err));
    return () => unsubscribe();
  }, [user.uid, user.email]);

  const handleTestWebhook = async (alias: Alias) => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/webhook/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'suporte@story.app.br',
          to: alias.aliasEmail,
          subject: 'Teste de Funcionamento 🚀',
          body: 'Se você está lendo isso, o seu sistema de e-mail está funcionando perfeitamente! Parabéns!',
          secret: 'story_webhook_secret_2026'
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast.success('Teste enviado! Abra o Inbox agora.');
      } else {
        const errorMsg = result.message || result.error || 'Erro desconhecido';
        toast.error('Erro no teste: ' + errorMsg);
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'aliases'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alias));
      setAliases(data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      }));
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleCreateAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAliasLabel.trim()) return;

    setIsCreating(true);
    try {
      const randomString = Math.random().toString(36).substring(2, 10);
      const aliasEmail = `${randomString}@story.app.br`;

      const newAlias: Alias = {
        id: aliasEmail,
        userId: user.uid,
        aliasEmail,
        targetEmail: user.email || '',
        label: newAliasLabel,
        createdAt: serverTimestamp() as Timestamp,
        isActive: true,
      };

      await setDoc(doc(db, 'aliases', aliasEmail), newAlias);
      toast.success('Alias criado com sucesso!');
      setIsModalOpen(false);
      setNewAliasLabel('');
    } catch (error) {
      console.error('Error creating alias:', error);
      toast.error('Erro ao criar alias.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const filteredAliases = aliases.filter(a => 
    a.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.aliasEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const downloadShortcut = () => {
    const content = `[InternetShortcut]\nURL=https://dash.cloudflare.com/\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Cloudflare.url';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('Atalho baixado! Arraste para sua área de trabalho.');
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-neutral-50/80 backdrop-blur-md border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-lg shadow-neutral-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">AliasMaster</h1>
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => signOut(auth)}
            className="p-2.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all active:scale-95"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-neutral-200 overflow-hidden border border-neutral-200">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400">
                <UserIcon className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-8">
        {/* System Status Section */}
        <section className="bg-neutral-900 text-white rounded-[2.5rem] p-8 space-y-6 shadow-2xl shadow-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center shadow-lg shadow-green-500/10">
                <ShieldCheck className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Status do Sistema</h2>
                <p className="text-xs text-neutral-400 font-medium uppercase tracking-widest">Servidor de E-mail</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Online</span>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
            <p className="text-sm text-neutral-300 leading-relaxed">
              Sua configuração no Cloudflare está <strong className="text-green-400">Ativa</strong>. O "Pegue tudo" (Catch-all) está enviando e-mails para o nosso sistema.
            </p>
          </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setIsDebugOpen(true)}
                className="flex-1 py-3 bg-white text-neutral-900 rounded-xl text-xs font-bold hover:bg-neutral-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Ver Logs
              </button>
              <button 
                onClick={() => {
                  if (aliases.length > 0) {
                    handleTestWebhook(aliases[0]);
                  } else {
                    toast.error('Crie um alias primeiro para testar.');
                  }
                }}
                disabled={isTesting}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isTesting ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Testar Agora
                  </>
                )}
              </button>
            </div>
          
          <div className="p-4 bg-neutral-800/50 rounded-2xl border border-neutral-700/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Instruções Críticas</p>
            <ol className="text-xs text-neutral-400 space-y-2 list-decimal pl-4">
              <li>Clique em <b>Baixar Atalho</b>.</li>
              <li>No Cloudflare, vá em <b>E-mail {'>'} Endereços de destino</b> e verifique se seu Gmail está <b>Verificado</b>.</li>
              <li>Em <b>Regras de roteamento</b>, a regra <b>Catch-all</b> deve apontar para o Worker <code className="text-orange-400">cold-king-2529</code>.</li>
            </ol>
          </div>
        </section>

        {/* Stats / Welcome */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Seus Aliases</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-xl font-semibold text-sm hover:bg-neutral-800 transition-all active:scale-95 shadow-lg shadow-neutral-200"
            >
              <Plus className="w-4 h-4" />
              Novo Alias
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por label ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 transition-all shadow-sm"
            />
          </div>
        </section>

        {/* Alias List */}
        <section className="space-y-4 pb-24">
          <AnimatePresence mode="popLayout">
            {filteredAliases.length > 0 ? (
              filteredAliases.map((alias) => (
                <motion.div
                  key={alias.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Label</span>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          alias.isActive ? "bg-green-500" : "bg-neutral-300"
                        )} />
                      </div>
                      <h3 className="text-lg font-bold text-neutral-900">{alias.label}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleTestWebhook(alias)}
                        disabled={isTesting}
                        className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all active:scale-90 flex items-center gap-2"
                        title="Enviar E-mail de Teste"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">Testar</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedAlias(alias);
                          setIsInboxOpen(true);
                        }}
                        className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all active:scale-90 flex items-center gap-2"
                        title="Ver Mensagens"
                      >
                        <Bell className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase">Inbox</span>
                      </button>
                      <button 
                        onClick={() => copyToClipboard(alias.aliasEmail)}
                        className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all active:scale-90"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                        <span className="text-sm font-mono truncate text-neutral-600">{alias.aliasEmail}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-widest px-1">
                      <span>Criado em {alias.createdAt?.toDate ? alias.createdAt.toDate().toLocaleDateString() : '...'}</span>
                      <span className={alias.isActive ? "text-green-600" : "text-neutral-400"}>
                        {alias.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-neutral-300" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-neutral-400">Nenhum alias encontrado</p>
                  <p className="text-xs text-neutral-400">Crie seu primeiro pseudônimo para começar.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-neutral-100 rounded-full mx-auto mb-8 sm:hidden" />
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">Novo Pseudônimo</h2>
                  <p className="text-sm text-neutral-500">Dê um nome para identificar onde você usará este e-mail.</p>
                </div>

                <form onSubmit={handleCreateAlias} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-1">Label do Alias</label>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Ex: Amazon, Netflix, Newsletter..."
                      value={newAliasLabel}
                      onChange={(e) => setNewAliasLabel(e.target.value)}
                      className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 transition-all"
                    />
                  </div>

                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Segurança</span>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Geraremos um e-mail aleatório que encaminhará todas as mensagens para <strong>{user.email}</strong>.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-6 py-4 bg-neutral-100 text-neutral-600 rounded-2xl font-bold hover:bg-neutral-200 transition-all active:scale-95"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={isCreating || !newAliasLabel.trim()}
                      className="flex-[2] px-6 py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-xl shadow-neutral-200 flex items-center justify-center gap-2"
                    >
                      {isCreating ? (
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                        />
                      ) : (
                        <>
                          Criar Alias
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inbox Modal */}
      <AnimatePresence>
        {isInboxOpen && selectedAlias && (
          <Inbox 
            alias={selectedAlias} 
            onClose={() => {
              setIsInboxOpen(false);
              setSelectedAlias(null);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Debug Logs Modal */}
      <AnimatePresence>
        {isDebugOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDebugOpen(false)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Logs do Webhook</h2>
                <button onClick={() => setIsDebugOpen(false)} className="p-2 hover:bg-neutral-100 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {debugLogs.length > 0 ? (
                  debugLogs.map((log) => (
                    <div key={log.id} className={cn(
                      "p-4 rounded-2xl border text-xs font-mono",
                      log.success ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                    )}>
                      <div className="flex justify-between mb-1">
                        <span className="font-bold">{log.success ? "SUCESSO" : "FALHA"}</span>
                        <span>{log.timestamp?.toDate?.().toLocaleTimeString()}</span>
                      </div>
                      <p>De: {log.from}</p>
                      <p>Para: {log.to}</p>
                      {log.subject && <p className="text-neutral-400 italic">Assunto: {log.subject}</p>}
                      {log.error && <p className="text-red-600 mt-1 font-bold">Erro: {log.error}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-center py-10 text-neutral-400">Nenhum log registrado ainda.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation Rail (Mobile) */}
      <nav className="fixed bottom-6 left-6 right-6 h-16 bg-neutral-900 rounded-2xl shadow-2xl shadow-neutral-400 flex items-center justify-around px-4 z-10">
        <button className="p-2 text-white transition-all active:scale-90">
          <Mail className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="p-3 bg-white text-neutral-900 rounded-xl -translate-y-4 shadow-xl shadow-neutral-900/20 transition-all active:scale-90"
        >
          <Plus className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setIsDebugOpen(true)}
          className="p-2 text-neutral-500 hover:text-white transition-all active:scale-90"
          title="Debug Logs"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
        <button className="p-2 text-neutral-500 hover:text-white transition-all active:scale-90">
          <Settings className="w-6 h-6" />
        </button>
      </nav>
    </div>
  );
}
