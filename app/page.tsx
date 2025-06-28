'use client';

import Image from 'next/image';

const infoCards = [
  {
    icon: '🎉',
    title: 'Para cada ocasión',
    text: 'Licores y bebidas para reuniones o un momento especial.'
  },
  {
    icon: '🚗',
    title: 'Entrega a domicilio',
    text: 'Recibe tu pedido en tu puerta, 20min aprox.'
  },
  {
    icon: '📱',
    title: 'Compra fácil',
    text: 'Haz tu pedido desde tu celular en pocos pasos.'
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header con logo centrado */}
      <header className="w-full py-4 shadow-sm flex justify-center items-center sticky top-0 bg-white z-40">
        <div className="relative w-40 h-14 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Licorera Zona Frank Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </header>
      {/* Cards informativas */}
      <div className="w-full flex flex-col items-center gap-3 mt-6 px-4">
        {infoCards.map((card, idx) => (
          <div
            key={idx}
            className="w-full max-w-sm bg-[#f8f6f4] border border-[#440d00] rounded-xl shadow flex items-center gap-4 px-4 py-3"
          >
            <span className="text-3xl" style={{ color: '#611d14' }}>{card.icon}</span>
            <div className="flex-1 text-left">
              <div className="font-bold text-base mb-1" style={{ color: '#440d00' }}>{card.title}</div>
              <div className="text-sm text-[#611d14]">{card.text}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Card de advertencia */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center text-center border" style={{ borderColor: '#440d00', marginTop: '2rem' }}>
          <div className="mb-4">
            <svg className="mx-auto" width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="#440d00">
              <circle cx="12" cy="12" r="10" stroke="#440d00" strokeWidth="2" fill="#611d14" fillOpacity="0.12" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#440d00' }}>Solo para mayores de 18 años</h1>
          <p className="mb-4 text-base" style={{ color: '#611d14' }}>
            El acceso y la compra de productos en esta tienda está restringido exclusivamente a personas mayores de edad.
          </p>
          <div className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: '#611d14', color: 'white' }}>
            Prohíbase el expendio de bebidas embriagantes a menores de edad. Ley 124 de 1994
          </div>
        </div>
      </main>
    </div>
  );
}
