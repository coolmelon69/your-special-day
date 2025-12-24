import { motion } from 'framer-motion';

const promises = [
  "1. Japan Trip",
  "2. Learn to cook steak",
  "3. Love you even more.",
];

const NextYearPromiseSlide = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Receipt Container */}
      <motion.div
        className="relative w-full max-w-md bg-white shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Receipt Header */}
        <motion.div
          className="border-b-2 border-dashed border-gray-300 px-6 py-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="font-mono text-lg sm:text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-wider">
            NEXT YEAR'S PROMISE
          </h2>
        </motion.div>

        {/* Receipt Items */}
        <div className="px-6 py-6 space-y-4">
          {promises.map((promise, index) => (
            <motion.div
              key={index}
              className="font-mono text-base sm:text-lg md:text-xl text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.3 + index * 0.3,
                ease: 'easeOut',
              }}
            >
              {promise}
            </motion.div>
          ))}
        </div>

        {/* Receipt Footer */}
        <motion.div
          className="border-t-2 border-dashed border-gray-300 px-6 py-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.2 }}
        >
          <div className="font-mono text-xs sm:text-sm text-gray-500">
            {new Date().getFullYear() + 1}
          </div>
        </motion.div>

        {/* Receipt tear lines (decorative) */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-50" />
        <div className="absolute left-0 right-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-50" />
      </motion.div>
    </div>
  );
};

export default NextYearPromiseSlide;


