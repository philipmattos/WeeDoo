import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Copy, AlertTriangle, LogIn, ArrowRight, Loader2, LaptopMinimalCheck, CircleAlert, UserRoundKey } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { fetchUserDataRecord } from '../../services/airtable';
import { useTaskStore } from '../../store/taskStore';
import { useKanbanStore } from '../../store/kanbanStore';
import { useNotesStore } from '../../store/notesStore';
import { useCalendarStore } from '../../store/calendarStore';
import { useThemeStore } from '../../store/themeStore';

export const WelcomeScreen = () => {
    const { loginWithCode, generateSaveCode } = useAuthStore();

    const [codeInput, setCodeInput] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [hasCopiedOnce, setHasCopiedOnce] = useState(false);
    const [isHydrating, setIsHydrating] = useState(false);
    const [loginError, setLoginError] = useState('');

    const handleCreateNew = () => {
        const newCode = generateSaveCode();
        setGeneratedCode(newCode);
        setIsDialogOpen(true);
        setCopied(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        setHasCopiedOnce(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleConfirmAndEnter = () => {
        setIsDialogOpen(false);
        loginWithCode(generatedCode);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = codeInput.trim();
        setLoginError('');
        if (code.length > 4) {
            setIsHydrating(true);
            try {
                // Tenta puxar dados das 5 tabelas simultaneamente
                const [tasksRes, kanbanRes, notesRes, calRes, configRes] = await Promise.all([
                    fetchUserDataRecord('UsersData_Tasks', code),
                    fetchUserDataRecord('UsersData_Kanban', code),
                    fetchUserDataRecord('UsersData_Notes', code),
                    fetchUserDataRecord('UsersData_Calendar', code),
                    fetchUserDataRecord('UsersData_Config', code),
                ]);

                const hasAnyData = tasksRes || kanbanRes || notesRes || calRes || configRes;

                if (!hasAnyData) {
                    setLoginError('Savecode não encontrado na nuvem.');
                    setIsHydrating(false);
                    setTimeout(() => setLoginError(''), 2000);
                    return; // Bloqueia o acesso sem dados reais
                }

                // Hidrata as "mentes" do Zustand se os registros existirem na nuvem
                if (tasksRes) useTaskStore.setState(JSON.parse(tasksRes.fields.Data));
                if (kanbanRes) useKanbanStore.setState(JSON.parse(kanbanRes.fields.Data));
                if (notesRes) useNotesStore.setState(JSON.parse(notesRes.fields.Data));
                if (calRes) useCalendarStore.setState(JSON.parse(calRes.fields.Data));
                if (configRes) useThemeStore.setState(JSON.parse(configRes.fields.Data));

                setIsHydrating(false);
                loginWithCode(code); // Libera o acesso para o Dashboard
            } catch (error) {
                console.error("Hydration failed due to network error.", error);
                setLoginError("Erro de Rede. É necessária uma conexão com a internet para buscar um Savecode.");
                setIsHydrating(false);
                setTimeout(() => setLoginError(''), 2000);
            }
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-wd-primary dark:bg-[#04C776] text-white font-sans sm:max-w-md sm:mx-auto sm:shadow-2xl sm:border-x border-white/10 justify-center p-6 px-8 relative">
            <style>{`
                @keyframes float-and-spin {
                    0% { transform: translateY(0px) rotate(0deg); }
                    15% { transform: translateY(-12px) rotate(0deg); }
                    30% { transform: translateY(0px) rotate(0deg); }
                    45% { transform: translateY(-12px) rotate(0deg); }
                    60% { transform: translateY(0px) rotate(0deg); }
                    75% { transform: translateY(-12px) rotate(0deg); }
                    92% { transform: translateY(0px) rotate(0deg); animation-timing-function: cubic-bezier(0.8, 0, 0.2, 1); }
                    100% { transform: translateY(0px) rotate(720deg); }
                }
                @keyframes fade-in-logo {
                    0% { opacity: 0; transform: scale(0.9) translateY(20px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes fade-in-up-stagger {
                    0% { opacity: 0; transform: translateY(30px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .anim-logo {
                    opacity: 0;
                    animation: fade-in-logo 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.8s, float-and-spin 8.8s infinite 2.3s;
                }
                .anim-shadow {
                    opacity: 0;
                    animation: fade-in-logo 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.8s;
                }
                .anim-content-1 {
                    opacity: 0;
                    animation: fade-in-up-stagger 1s cubic-bezier(0.16, 1, 0.3, 1) forwards 1.8s;
                }
                .anim-content-2 {
                    opacity: 0;
                    animation: fade-in-up-stagger 1s cubic-bezier(0.16, 1, 0.3, 1) forwards 1.8s;
                }
                @keyframes shake-form {
                    0%, 100% { transform: translate(0, 0); }
                    10%, 30%, 50%, 70%, 90% { transform: translate(-4px, -2px); }
                    20%, 40%, 60%, 80% { transform: translate(4px, 2px); }
                }
                .anim-shake {
                    animation: shake-form 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
                }
            `}</style>

            <div className="text-center mb-10 z-10 flex flex-col items-center">
                <div className="relative mb-8">
                    <div className="anim-logo w-24 h-24 bg-white text-wd-primary rounded-[2rem] flex items-center justify-center shadow-xl relative z-10">
                        <LaptopMinimalCheck size={48} strokeWidth={2.5} />
                    </div>
                    {/* Sombra da flutuação */}
                    <div className="anim-shadow absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/35 blur-md rounded-full"></div>
                </div>

                <div className="anim-content-1">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-3 drop-shadow-md">WeeDoo</h1>
                    <p className="text-white/80 text-sm leading-relaxed px-2 font-medium">
                        Seu hub pessoal de produtividade.<br />
                        Local-First e totalmente seguro.
                    </p>
                </div>
            </div>

            <div className="space-y-6 z-10 w-full flex flex-col items-center anim-content-1">
                <Button
                    onClick={handleCreateNew}
                    className="w-full h-14 text-lg rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:shadow-xl hover:-translate-y-1 transition-all bg-white hover:bg-slate-50 font-bold text-wd-primary flex items-center justify-center gap-3 [&_svg]:size-9"
                >
                    <UserRoundKey size={32} strokeWidth={2.5} />
                    Criar novo usuário
                </Button>

                <div className="w-full relative flex items-center justify-center py-2 anim-content-2">
                    <div className="border-t border-white/20 w-full absolute"></div>
                    <span className="bg-wd-primary dark:bg-[#04C776] px-4 text-xs font-bold text-white/70 uppercase tracking-widest z-10 relative">OU</span>
                </div>

                <form onSubmit={handleLogin} className="w-full relative flex flex-col gap-3 anim-content-2">
                    <label className="text-sm font-semibold text-white/90 ml-2 drop-shadow-sm">Já possuo um Savecode</label>
                    <div className={`flex bg-white/20 backdrop-blur-md p-1 rounded-full shadow-inner border border-white/30 focus-within:ring-2 focus-within:ring-white/50 transition-shadow ${loginError ? 'anim-shake' : ''}`}>
                        <Input
                            type="text"
                            placeholder="Ex: wd-A8K3PX9V..."
                            value={codeInput}
                            onChange={(e) => setCodeInput(e.target.value)}
                            className="flex-1 h-12 bg-transparent text-white border-none shadow-none focus-visible:ring-0 px-4 text-base font-bold placeholder:text-white/50"
                            required
                        />
                        <Button
                            type="submit"
                            disabled={codeInput.trim().length < 5 || isHydrating}
                            size="icon"
                            className="w-12 h-12 shrink-0 rounded-full bg-white text-wd-primary hover:bg-slate-100 disabled:opacity-50 disabled:bg-white/50 transition-colors shadow-md flex items-center justify-center"
                        >
                            {isHydrating ? <Loader2 size={20} className="animate-spin text-wd-primary" /> : <ArrowRight size={20} strokeWidth={3} />}
                        </Button>
                    </div>
                    {loginError && (
                        <div className="absolute top-full left-0 right-0 mt-3 w-full flex items-center gap-2 justify-center bg-[#ffe9d9] text-[#7f1d1d] p-3 rounded-2xl text-sm font-bold shadow-xl border border-[#fca5a5] z-20">
                            <CircleAlert size={18} strokeWidth={2.5} />
                            <p>{loginError}</p>
                        </div>
                    )}
                </form>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (!open && !generateSaveCode) setIsDialogOpen(false);
            }}>
                <DialogContent className="sm:max-w-xs rounded-[2rem] bg-white dark:bg-slate-800 border-none p-6 shadow-2xl w-[90vw]" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader className="mb-2 items-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-2 shadow-sm">
                            <AlertTriangle size={32} />
                        </div>
                        <DialogTitle className="text-center text-xl font-extrabold text-[#0c2f37] dark:text-slate-100">Guarde sua ID!</DialogTitle>
                    </DialogHeader>

                    <div className="text-center space-y-4">
                        <div className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                            Essa ID guarda <strong>todas</strong> as suas informações. <br />
                            <span className="text-red-500 font-bold">Se você perder essa ID, não poderá recuperar seus dados nunca mais.</span> Não compartilhe com ninguém.
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex items-center justify-between gap-3 group">
                            <code className="text-lg font-black tracking-wider text-slate-800 dark:text-slate-100 w-full text-center select-all">
                                {generatedCode}
                            </code>
                            <Button
                                type="button"
                                onClick={handleCopy}
                                size="icon"
                                className={`w-10 h-10 shrink-0 rounded-xl transition-all ${copied ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 shadow-sm'}`}
                            >
                                <Copy size={18} />
                            </Button>
                        </div>
                        {copied && <p className="text-xs text-emerald-500 font-bold animate-pulse -mt-2">Copiado para área de transferência!</p>}

                        <Button
                            onClick={handleConfirmAndEnter}
                            disabled={!hasCopiedOnce}
                            className="w-full h-12 rounded-full font-bold bg-wd-primary hover:bg-wd-primary-dark text-white mt-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {hasCopiedOnce ? 'Entrar no Aplicativo' : 'Copie a ID primeiro'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
