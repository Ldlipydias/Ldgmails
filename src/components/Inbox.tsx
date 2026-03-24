import React, { useState, useEffect } from 'react';
import { Alias, Message } from '../types';
import { X, RefreshCw, Mail, Calendar, User, ArrowLeft, Inbox as InboxIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { db, collection, query, where, onSnapshot, orderBy } from '../firebase';

interface InboxProps {
  alias: Alias;
  onClose: () => void;
}

export default function Inbox({ alias, onClose }: InboxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);

  useEffect(() => {
    if (!alias.userId) return;
    
    setLoading(true);
    // Query only by userId to avoid needing composite indexes for now
    const q = query(
      collection(db, 'messages'), 
      where('userId', '==', alias.userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      
      // Filter by aliasEmail in memory
      const filteredData = data.filter(msg => 
        msg.aliasEmail?.toLowerCase() === alias.aliasEmail.toLowerCase()
      );

      // Sort manually in memory
      const sortedData = filteredData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setMessages(sortedData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching messages:', error);
      toast.error('Erro ao carregar mensagens.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [alias.aliasEmail]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl h-full sm:h-[80vh] bg-white sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={selectedMsg ? () => setSelectedMsg(null) : onClose}
              className="p-2 hover:bg-neutral-100 rounded-xl transition-all"
            >
              {selectedMsg ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
            <div>
              <h2 className="font-bold text-lg tracking-tight">
                {selectedMsg ? 'Mensagem' : 'Caixa de Entrada'}
              </h2>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest truncate max-w-[150px] sm:max-w-xs">
                {alias.aliasEmail}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {selectedMsg ? (
              <motion.div 
                key="msg-body"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
                    {selectedMsg.subject || '(Sem Assunto)'}
                  </h1>
                  
                  <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">De</p>
                      <p className="text-sm font-semibold truncate text-neutral-700">{selectedMsg.from}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Data</p>
                      <p className="text-[10px] text-neutral-500">
                        {selectedMsg.createdAt?.toDate ? selectedMsg.createdAt.toDate().toLocaleString() : '...'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="prose prose-neutral max-w-none">
                  <pre className="text-sm text-neutral-600 whitespace-pre-wrap font-sans leading-relaxed">
                    {selectedMsg.body}
                  </pre>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="msg-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {messages.length > 0 ? (
                  messages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => setSelectedMsg(msg)}
                      className="w-full text-left p-5 bg-white border border-neutral-100 rounded-3xl hover:border-neutral-300 hover:shadow-md transition-all group flex gap-4"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-300 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest truncate max-w-[120px]">
                            {msg.from}
                          </p>
                          <span className="text-[10px] text-neutral-300 font-medium">
                            {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString() : '...'}
                          </span>
                        </div>
                        <h3 className="font-bold text-neutral-900 truncate pr-4">
                          {msg.subject || '(Sem Assunto)'}
                        </h3>
                        <p className="text-xs text-neutral-400 truncate">
                          Clique para ler o conteúdo da mensagem...
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-20 space-y-4">
                    <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto">
                      <InboxIcon className="w-10 h-10 text-neutral-200" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-neutral-400">Caixa Vazia</p>
                      <p className="text-xs text-neutral-400 max-w-[200px] mx-auto leading-relaxed">
                        Aguardando novas mensagens para este alias. Elas aparecerão aqui automaticamente.
                      </p>
                    </div>
                    {loading && (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-800 rounded-full mx-auto"
                      />
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer Info */}
        {!selectedMsg && (
          <div className="p-4 bg-neutral-50 border-t border-neutral-100 text-center">
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
              As mensagens aparecem em tempo real via Webhook
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
