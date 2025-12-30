
import React, { useState } from 'react';
import { useGameStore } from '../store.ts';

const AuthView: React.FC = () => {
  const { signIn, signUp, enterAsGuest } = useGameStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGuestEntry = () => {
    enterAsGuest(name || 'Convidado Real');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      if (isLogin) {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, name || 'Desafiante');
        setSuccessMsg('Conta criada com sucesso! Faça seu login.');
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Erro na autenticação.';
      
      // Mapeamento robusto de erros do Supabase
      if (msg.toLowerCase().includes('email not confirmed')) {
        msg = 'O administrador exige confirmação de e-mail.';
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        msg = 'E-mail ou senha incorretos. Verifique se digitou corretamente ou se já possui uma conta.';
      } else if (msg.toLowerCase().includes('user already registered')) {
        msg = 'Este e-mail já está em uso por outro Rei.';
      } else if (msg.toLowerCase().includes('weak_password')) {
        msg = 'A senha deve ter pelo menos 6 caracteres.';
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#0b1421] flex items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-md bg-[#1a2b45] rounded-[40px] border-4 border-blue-400 p-8 shadow-2xl animate-in zoom-in duration-300 my-auto">
        <div className="text-center mb-8">
           <div className="text-6xl mb-4 animate-float">👑</div>
           <h1 className="text-4xl font-black clash-text italic text-white uppercase tracking-tighter drop-shadow-lg leading-none">Uno Royale</h1>
           <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mt-4 italic">
             {isLogin ? 'ENTRE NA ARENA' : 'CADASTRE-SE PARA LUTAR'}
           </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <input 
              id="name"
              name="name"
              type="text" 
              autoComplete="name"
              placeholder="NOME DO REI / RAINHA" 
              className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-4 text-white font-black italic text-sm focus:border-blue-400 outline-none transition-all uppercase placeholder:text-white/20"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          )}
          <input 
            id="email"
            name="email"
            type="email" 
            autoComplete="email"
            placeholder="E-MAIL" 
            className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-4 text-white font-black italic text-sm focus:border-blue-400 outline-none transition-all placeholder:text-white/20"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input 
            id="password"
            name="password"
            type="password" 
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder="SENHA" 
            className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-4 text-white font-black italic text-sm focus:border-blue-400 outline-none transition-all placeholder:text-white/20"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
              <p className="text-red-400 text-[10px] font-black uppercase text-center leading-tight">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
              <p className="text-emerald-400 text-[10px] font-black uppercase text-center leading-tight">{successMsg}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 bg-yellow-500 py-5 rounded-2xl border-b-8 border-yellow-800 font-black clash-text italic text-xl uppercase text-black active:translate-y-2 active:border-b-0 transition-all disabled:opacity-50 shadow-lg"
          >
            {loading ? 'CONECTANDO...' : isLogin ? 'ENTRAR AGORA' : 'CRIAR CONTA REAL'}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-6">
           <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
           <span className="relative bg-[#1a2b45] px-4 text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">OU</span>
        </div>

        <button 
           onClick={handleGuestEntry}
           className="w-full py-4 bg-blue-600 border-b-6 border-blue-900 rounded-2xl font-black clash-text italic text-xs uppercase text-white active:translate-y-1 active:border-b-0 transition-all shadow-lg"
        >
           ENTRAR COMO CONVIDADO
        </button>

        <button 
          onClick={() => {
            setError('');
            setSuccessMsg('');
            setIsLogin(!isLogin);
          }}
          className="w-full mt-8 text-blue-300 font-black italic text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:text-white transition-colors"
        >
          {isLogin ? 'Novo por aqui? Criar conta' : 'Já é um Rei? Fazer Login'}
          <span className="text-xs">➔</span>
        </button>
      </div>
    </div>
  );
};

export default AuthView;
