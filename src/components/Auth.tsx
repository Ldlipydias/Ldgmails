import { signInWithPopup, auth, googleProvider } from '../firebase';
import { Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';

export default function Auth() {
  const handleLogin = async () => {
    const toastId = toast.loading('Conectando ao Google...');
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Login realizado com sucesso!', { id: toastId });
    } catch (error: any) {
      console.error('Login error:', error);
      let message = 'Erro ao entrar com Google.';
      
      if (error.code === 'auth/unauthorized-domain') {
        message = 'Domínio não autorizado no Firebase. Adicione "gmailsld.netlify.app" nas configurações de Autenticação.';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'O popup de login foi bloqueado pelo seu navegador.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = 'O login foi cancelado.';
      }
      
      toast.error(message, { id: toastId, duration: 6000 });
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 text-center">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-900 text-white mb-4 shadow-xl shadow-neutral-200">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
          AliasMaster
        </h1>
        <p className="text-neutral-500 text-lg max-w-xs mx-auto">
          Proteja seu e-mail real com pseudônimos seguros e descartáveis.
        </p>
      </div>

      <div className="space-y-4 pt-8">
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-neutral-200 rounded-2xl font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all active:scale-[0.98] shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Entrar com Google
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 uppercase tracking-widest font-medium">
          <div className="h-[1px] w-8 bg-neutral-200" />
          <span>Privacidade Total</span>
          <div className="h-[1px] w-8 bg-neutral-200" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-left pt-8">
        <div className="p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm">
          <Mail className="w-5 h-5 text-neutral-400 mb-2" />
          <h3 className="font-semibold text-sm">Sem Spam</h3>
          <p className="text-xs text-neutral-500 mt-1">Bloqueie aliases a qualquer momento.</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-neutral-400 mb-2" />
          <h3 className="font-semibold text-sm">Seguro</h3>
          <p className="text-xs text-neutral-500 mt-1">Seu e-mail real nunca é exposto.</p>
        </div>
      </div>
    </div>
  );
}
