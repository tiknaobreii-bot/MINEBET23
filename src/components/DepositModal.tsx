import React, { useState } from 'react';
import { X, Copy, Check, Info, Gem, MapPin, Server, AlertCircle } from 'lucide-react';
import { Player } from '../types';
import { sounds } from '../utils/audio';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  serverIp?: string;
  bancaCoordinates?: string;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  player,
  serverIp = 'jogar.minebet.com.br',
  bancaCoordinates = 'X: 120, Y: 64, Z: -350 (NPC Banca do Cassino no Spawn)',
}) => {
  const [copiedNick, setCopiedNick] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);

  if (!isOpen) return null;

  const handleCopyNick = () => {
    if (player?.username) {
      navigator.clipboard.writeText(player.username);
      setCopiedNick(true);
      sounds.playChip();
      setTimeout(() => setCopiedNick(false), 2000);
    }
  };

  const handleCopyIp = () => {
    navigator.clipboard.writeText(serverIp);
    setCopiedIp(true);
    sounds.playChip();
    setTimeout(() => setCopiedIp(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#101622] border border-cyan-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-cyan-950/50">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d121c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Gem className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white tracking-wide">
                DEPOSITAR DIAMANTES
              </h3>
              <p className="text-xs text-slate-400">Instruções para adicionar saldo</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          
          {/* Main Server Notice Banner as instructed */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200/90 leading-relaxed font-medium">
              "Entregue os diamantes na banca no servidor e aguarde o admin creditar."
            </div>
          </div>

          {/* Step by step */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Passo a Passo no Servidor:
            </h4>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <p className="font-semibold text-white">Conecte-se ao servidor de Minecraft:</p>
                  <div className="flex items-center justify-between mt-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <code className="text-cyan-300 font-mono text-xs">{serverIp}</code>
                    <button onClick={handleCopyIp} className="text-slate-400 hover:text-white ml-2 flex items-center gap-1 text-[11px]">
                      {copiedIp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIp ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <p className="font-semibold text-white">Vá até a Banca do Cassino no Spawn:</p>
                  <p className="text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{bancaCoordinates}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <p className="font-semibold text-white">Entregue os diamantes para o Admin/NPC:</p>
                  <p className="text-slate-400 mt-0.5">
                    Informe seu nick exato registrado no site:
                  </p>
                  {player ? (
                    <div className="flex items-center justify-between mt-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-emerald-400 font-mono font-bold text-xs">{player.username}</span>
                      <button onClick={handleCopyNick} className="text-slate-400 hover:text-white ml-2 flex items-center gap-1 text-[11px]">
                        {copiedNick ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedNick ? 'Copiado!' : 'Copiar Nick'}</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-rose-400 mt-1">Faça login no site para visualizar seu nick.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center">
            Assim que a entrega for confirmada pelo admin no servidor, seus diamantes aparecem instantaneamente no site.
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Entendido, fechar
          </button>
        </div>

      </div>
    </div>
  );
};
