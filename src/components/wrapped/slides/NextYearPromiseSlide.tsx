import { motion } from 'framer-motion';

const promises = [
  "1. lessen ragebaitingg 😇",
  "2. Adapt to the increase of difficulty",
  "3. Love you even more.",
  "4. More money.",
  "5. become non celen",
];

// Generate barcode bars
const generateBarcode = () => {
  const bars = [];
  for (let i = 0; i < 20; i++) {
    const width = Math.random() * 3 + 1;
    bars.push(
      <div
        key={i}
        className={Math.random() > 0.3 ? 'bar' : 'bar space'}
        style={{
          width: `${width}px`,
          height: '36px',
          background: Math.random() > 0.3 ? '#1a1a1a' : 'transparent',
        }}
      />
    );
  }
  return bars;
};

const NextYearPromiseSlide = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Receipt Container */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          maxWidth: '400px',
          width: '100%',
          transform: 'rotate(-2deg)',
          fontFamily: "'Courier New', Courier, monospace",
          background: '#f4f4f2',
          padding: '2rem 2rem 2.5rem',
          color: '#2a2a2a',
          fontSize: '0.9rem',
          lineHeight: '1.6',
          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 14px), 95% 100%, 90% calc(100% - 14px), 85% 100%, 80% calc(100% - 14px), 75% 100%, 70% calc(100% - 14px), 65% 100%, 60% calc(100% - 14px), 55% 100%, 50% calc(100% - 14px), 45% 100%, 40% calc(100% - 14px), 35% 100%, 30% calc(100% - 14px), 25% 100%, 20% calc(100% - 14px), 15% 100%, 10% calc(100% - 14px), 5% 100%, 0 calc(100% - 14px))',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 20px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
          position: 'relative',
        }}
      >
        {/* Texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' result='noise'/%3E%3CfeColorMatrix in='noise' type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
            pointerEvents: 'none',
          }}
        />

        {/* Receipt Header */}
        <motion.div
          className="text-center relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px dashed rgba(0, 0, 0, 0.2)',
          }}
        >
          <div
            className="receipt-store"
            style={{
              fontWeight: 700,
              letterSpacing: '0.15em',
              fontSize: '1rem',
              marginBottom: '0.3rem',
              opacity: 0.8,
            }}
          >
            MY PROMISES
          </div>
          <div
            className="receipt-est"
            style={{
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              opacity: 0.75,
            }}
          >
            EST. {new Date().getFullYear()}
          </div>
        </motion.div>

        {/* Receipt Items */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{
            marginBottom: '1rem',
          }}
        >
          {promises.map((promise, index) => (
            <motion.div
              key={index}
              className="receipt-line"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.85, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.3 + index * 0.15,
                ease: 'easeOut',
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.5rem',
                marginBottom: '0.4rem',
                fontSize: '0.9rem',
                lineHeight: '1.6',
              }}
            >
              <span>{promise}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Receipt Total Separator */}
        <div className="relative z-10" style={{ opacity: 0.8 }}>
          <hr
            className="receipt-total-sep"
            style={{
              border: 'none',
              borderTop: '2px solid #1a1a1a',
              margin: '0.75rem 0 0.5rem',
            }}
          />
          <div
            style={{
              borderTop: '1px solid #1a1a1a',
              marginTop: '2px',
              marginBottom: '0.5rem',
            }}
          />
        </div>

        {/* Receipt Total */}
        <motion.div
          className="receipt-total relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.4, delay: 1.0 }}
          style={{
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '0.5rem',
            fontSize: '0.95rem',
          }}
        >
          PROMISES MADE &nbsp; {promises.length}
        </motion.div>
        <motion.div
          className="receipt-total relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.4, delay: 1.1 }}
          style={{
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '1rem',
            fontSize: '0.95rem',
          }}
        >
          YEAR &nbsp; {new Date().getFullYear() + 1}
        </motion.div>

        {/* Receipt Thanks */}
        <motion.div
          className="receipt-thanks relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.4, delay: 1.2 }}
          style={{
            textAlign: 'center',
            fontSize: '0.8rem',
            letterSpacing: '0.12em',
            marginBottom: '0.75rem',
          }}
        >
          THANK YOU FOR BEING YOU
        </motion.div>

        {/* Receipt Barcode */}
        <motion.div
          className="receipt-barcode relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.3 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: 0,
            height: '36px',
            margin: '0 auto',
            maxWidth: '240px',
          }}
        >
          {generateBarcode()}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NextYearPromiseSlide;


