import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, Coins, Layout, Check, ShoppingCart, Layers } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useEconomyStore, COSMETIC_CATALOGUE, CHIP_PACKS } from '../../store/economyStore';
import type { CosmeticCategory, CosmeticItem } from '../../store/economyStore';

type StoreTab = 'chips' | 'felts' | 'cardBacks';

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onAnimComplete: () => void }> = ({ message, type, onAnimComplete }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    onAnimationComplete={onAnimComplete}
    className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-bold shadow-lg z-[60] flex items-center gap-2 ${
      type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
    }`}
  >
    {type === 'success' ? <Check size={14} /> : <X size={14} />}
    {message}
  </motion.div>
);

export const StorefrontModal: React.FC = () => {
  const { closeModal } = useUIStore();
  const { premiumCurrency, inventory, equipped, equipItem, purchaseItem, addCurrency } = useEconomyStore();
  
  const [activeTab, setActiveTab] = useState<StoreTab>('chips');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleEquip = (category: CosmeticCategory, itemId: string) => {
    equipItem(category, itemId);
    showToast('Equipped successfully', 'success');
  };

  const handlePurchase = (item: CosmeticItem) => {
    const success = purchaseItem(item.id, item.goldCost);
    if (success) {
      showToast(`Purchased ${item.name}`, 'success');
    } else {
      showToast('Not enough Gold Coins', 'error');
    }
  };

  const handleBuyChips = (pack: typeof CHIP_PACKS[0]) => {
    // In Phase 5.1 this will hook up to a payment gateway
    showToast(`Purchased ${pack.label} (Simulated)`, 'success');
    addCurrency(pack.goldCost); // For simulation, just giving them gold back or adding it.
    // Wait, the pack says "goldCost". Does buying a chip pack cost real money or gold?
    // If it costs Gold, let's deduct gold and maybe add chips to player balance.
    // Actually, usually you buy Gold with real money, and chips with Gold.
    // Let's assume you buy chips with Gold.
    if (premiumCurrency >= pack.goldCost) {
       useEconomyStore.setState(s => ({ premiumCurrency: s.premiumCurrency - pack.goldCost }));
       showToast(`Bought ${pack.chips} chips!`, 'success');
    } else {
       showToast('Not enough Gold Coins', 'error');
    }
  };

  const renderCosmetics = (categoryFilter: CosmeticCategory) => {
    const items = COSMETIC_CATALOGUE.filter(c => c.category === categoryFilter);

    return (
      <div className="grid grid-cols-2 gap-3 p-4">
        {items.map(item => {
          const isOwned = inventory.includes(item.id);
          const isEquipped = equipped[categoryFilter] === item.id;

          return (
            <div
              key={item.id}
              className={`
                group relative flex flex-col rounded-xl overflow-hidden
                border transition-all duration-200
                ${isEquipped ? 'border-gold bg-gold/5' : 'border-surface-elevated/60 bg-surface-card hover:scale-105 hover:border-surface-elevated'}
              `}
            >
              {/* Preview Area */}
              <div className={`h-24 w-full flex items-center justify-center ${item.previewClass}`}>
                {categoryFilter === 'cardBack' && (
                   <div className="w-10 h-14 rounded bg-white/10 border border-white/20 shadow-md" />
                )}
                {categoryFilter === 'felt' && (
                   <div className="w-16 h-8 rounded-full bg-black/20 border border-white/10" />
                )}
              </div>

              {/* Info Area */}
              <div className="p-3 flex flex-col flex-1">
                <h3 className="text-sm font-bold text-slate-200">{item.name}</h3>
                <p className="text-[10px] text-slate-500 mb-3 flex-1">{item.description}</p>
                
                {isEquipped ? (
                  <button disabled className="w-full py-1.5 rounded-lg text-xs font-bold bg-gold/20 text-gold border border-gold/30 flex items-center justify-center gap-1">
                    <Check size={12} /> Equipped
                  </button>
                ) : isOwned ? (
                  <button 
                    onClick={() => handleEquip(categoryFilter, item.id)}
                    className="w-full py-1.5 rounded-lg text-xs font-bold bg-surface-elevated text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    Equip
                  </button>
                ) : (
                  <button 
                    onClick={() => handlePurchase(item)}
                    className="w-full py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Coins size={12} className="text-yellow-400" /> {item.goldCost}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderChips = () => (
    <div className="flex flex-col gap-3 p-4">
      {CHIP_PACKS.map(pack => (
        <div key={pack.id} className="flex items-center justify-between p-3 rounded-xl border border-surface-elevated/60 bg-surface-card hover:border-gold/30 hover:bg-gold/5 transition-all duration-200 group hover:scale-[1.02]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Coins className="text-gold" size={18} />
             </div>
             <div>
               <h3 className="text-sm font-bold text-slate-200">{pack.label}</h3>
               <p className="text-xs text-slate-400 font-display font-semibold">{pack.chips.toLocaleString()} Chips</p>
               {pack.bonus && <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">{pack.bonus}</span>}
             </div>
          </div>
          <button 
            onClick={() => handleBuyChips(pack)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-elevated text-white group-hover:bg-gold group-hover:text-surface transition-colors flex items-center gap-1.5"
          >
             <Coins size={12} className="text-yellow-400 group-hover:text-white" /> {pack.goldCost}
          </button>
        </div>
      ))}
      <p className="text-center text-[10px] text-slate-600 mt-2">Purchase chips to play at higher stakes tables.</p>
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
        onClick={closeModal}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="
            pointer-events-auto w-full max-w-md
            bg-surface/95 backdrop-blur-xl
            border border-surface-elevated/60
            rounded-2xl shadow-2xl overflow-hidden
            flex flex-col max-h-[85vh] relative
          "
        >
          {/* Top accent */}
          <div className="h-1 w-full bg-gradient-to-r from-gold/80 via-yellow-400 to-gold/80" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-elevated/40">
            <div className="flex items-center gap-2.5">
              <Store size={18} className="text-gold" />
              <h2 className="font-display font-bold text-slate-100 text-lg">Store</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/20">
                 <Coins size={14} className="text-gold" />
                 <span className="text-xs font-bold text-gold">{premiumCurrency}</span>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-elevated/60 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex p-2 gap-1 border-b border-surface-elevated/40 bg-surface-card/40 flex-shrink-0">
             {([
               { id: 'chips', label: 'Chips', icon: <Coins size={14} /> },
               { id: 'felts', label: 'Table Felts', icon: <Layout size={14} /> },
               { id: 'cardBacks', label: 'Card Backs', icon: <Layers size={14} /> }
             ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as StoreTab)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all
                    ${activeTab === tab.id 
                       ? 'bg-gold/15 text-gold border border-gold/30 shadow-sm' 
                       : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated/30 border border-transparent'}
                  `}
                >
                  {tab.icon} {tab.label}
                </button>
             ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0 relative">
             <AnimatePresence mode="wait">
               {activeTab === 'chips' && (
                 <motion.div key="chips" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                   {renderChips()}
                 </motion.div>
               )}
               {activeTab === 'felts' && (
                 <motion.div key="felts" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                   {renderCosmetics('felt')}
                 </motion.div>
               )}
               {activeTab === 'cardBacks' && (
                 <motion.div key="cardBacks" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                   {renderCosmetics('cardBack')}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
          
          <AnimatePresence>
            {toast && <Toast message={toast.message} type={toast.type} onAnimComplete={() => {}} />}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};
