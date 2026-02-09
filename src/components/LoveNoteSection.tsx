import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, Quote, Sparkles, CheckSquare, Gift, ArrowRight, QrCode, Calendar, Lock } from "lucide-react";
import { NavLink } from "./NavLink";

const friendWishes = [
  { name: "popi", message: "Happy 22 my dearest dinzy!!!!!! i'm so grateful to have known you throughout this whole crazy uni shit. wouldn't trade you with anything in the world!! thank you for always include saya di mana mana yang berkaitan hehe. i hope this year will be a very great year for you and i would lovee to see you strive in your own way. love uou lots!!! dont worry, we will be friends for a verrryy long time. love, popi." },
  { name: "Mike", message: "Wishing you the happiest of birthdays! 🎉" },
  { name: "Emma", message: "You deserve all the happiness in the world! 💕" },
  { name: "David", message: "Have an amazing day, birthday star! ⭐" },
  { name: "Lisa", message: "Cheers to another year of being awesome! 🥳" },
  { name: "Tom", message: "May your special day be as wonderful as you! 🌟" },
];

const LoveNoteSection = () => {
  const navigate = useNavigate();

  const handleWrappedClick = () => {
    navigate('/wrapped');
  };

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Heart className="mx-auto mb-4 text-primary" size={36} fill="currentColor" />
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            A Letter <span className="text-gradient-romantic">From My Heart</span>
          </h2>
        </motion.div>

        {/* Blurred Secret Letter */}
        <motion.div
          className="max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="relative bg-card rounded-3xl p-8 md:p-12 shadow-xl overflow-hidden"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23f4a5b8' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            }}
            whileHover={{
              scale: 1.01,
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Blurred Letter Content */}
            <motion.div
              className="font-serif text-lg md:text-xl leading-relaxed text-foreground/90 space-y-4"
              style={{
                filter: 'blur(15px)',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              animate={{
                x: [0, 2, -2, 0],
                opacity: [0.3, 0.35, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <p>My Dearest Love,</p>
              
              <p>
                On this special day, I want you to know how incredibly lucky I feel to have you in my life. 
                From the moment we met, you've filled my world with so much joy, laughter, and love that 
                I never knew was possible.
              </p>
              
              <p>
                Your smile brightens even my darkest days, your kindness inspires me to be better, 
                and your love gives me strength I never knew I had. Every moment with you is a treasure, 
                and I cherish each one more than words could ever express.
              </p>
              
              <p>
                On your birthday, I wish you all the happiness, success, and dreams come true. 
                But most of all, I wish for us to have countless more adventures, endless laughs, 
                and a lifetime of love together.
              </p>
              
              <p className="font-script text-2xl text-primary pt-4">
                Forever and always yours,
                <br />
                Your Partner 💕
              </p>
            </motion.div>

            {/* Glassmorphism Overlay */}
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-12 z-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div
                className="bg-white/20 backdrop-blur-sm rounded-2xl px-12 py-14 md:p-12 border border-white/30 shadow-xl max-w-[80%] text-center min-h-[280px] md:min-h-auto"
                style={{
                  fontFamily: "'Playfair Display', 'Lora', serif",
                }}
              >
                <motion.p
                  className="text-lg md:text-xl lg:text-2xl leading-relaxed mb-6"
                  style={{
                    color: '#8B7355',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  Some words are meant to be felt on paper. They're waiting for you at the end of our journey.
                </motion.p>

                {/* Lock Icon and Timestamp */}
                <motion.div
                  className="flex items-center justify-center gap-2 text-sm md:text-base"
                  style={{
                    color: '#8B7355',
                    opacity: 0.7,
                  }}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.7 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <Lock className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-serif">19.11.2025</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Friend Wishes */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Sparkles className="mx-auto mb-4 text-primary" size={28} />
          <h3 className="font-serif text-2xl md:text-3xl font-bold">
            Wishes from Friends
          </h3>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {friendWishes.map((wish, index) => (
            <motion.div
              key={index}
              className="bg-card rounded-2xl p-6 shadow-lg border border-border"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, boxShadow: "0 20px 40px -10px hsl(340 65% 65% / 0.2)" }}
            >
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4">
                <span className="font-bold text-accent-foreground">{wish.name[0]}</span>
              </div>
              <p className="text-muted-foreground mb-3">{wish.message}</p>
              <p className="font-medium text-foreground">— {wish.name}</p>
            </motion.div>
          ))}
        </div>

        {/* Navigation Section */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="font-serif text-2xl md:text-3xl font-bold mb-8">
            Explore More
          </h3>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Stamps Navigation Card */}
          <NavLink to="/stamps" className="h-full">
            <motion.div
              className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-3xl p-8 text-white shadow-xl cursor-pointer relative overflow-hidden h-full flex flex-col"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ duration: 0.3 }}
            >
              {/* Decorative elements */}
              <div className="absolute top-4 right-4">
                <Sparkles className="text-white/30" size={24} />
              </div>
              <div className="absolute bottom-4 left-4">
                <Sparkles className="text-white/20" size={20} />
              </div>

              <div className="relative z-10 flex flex-col flex-grow">
                <CheckSquare className="mb-4" size={48} />
                <h4 className="font-serif text-2xl font-bold mb-2">Stamp Collection</h4>
                <p className="text-white/90 mb-6 flex-grow">
                  View all your collected adventure stamps
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full font-medium">
                  View Stamps
                  <ArrowRight size={18} />
                </div>
              </div>
            </motion.div>
          </NavLink>

          {/* Coupons Navigation Card */}
          <NavLink to="/coupons" className="h-full">
            <motion.div
              className="bg-gradient-to-br from-purple-400 to-indigo-500 rounded-3xl p-8 text-white shadow-xl cursor-pointer relative overflow-hidden h-full flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ duration: 0.3 }}
            >
              {/* Decorative elements */}
              <div className="absolute top-4 right-4">
                <Sparkles className="text-white/30" size={24} />
              </div>
              <div className="absolute bottom-4 left-4">
                <Sparkles className="text-white/20" size={20} />
              </div>

              <div className="relative z-10 flex flex-col flex-grow">
                <Gift className="mb-4" size={48} />
                <h4 className="font-serif text-2xl font-bold mb-2">Gift Coupons</h4>
                <p className="text-white/90 mb-6 flex-grow">
                  Unlock and redeem your special gift coupons
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full font-medium">
                  View Coupons
                  <ArrowRight size={18} />
                </div>
              </div>
            </motion.div>
          </NavLink>

          {/* QR Scanner Navigation Card */}
          <NavLink to="/scan-qr" className="h-full">
            <motion.div
              className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl p-8 text-white shadow-xl cursor-pointer relative overflow-hidden h-full flex flex-col"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ duration: 0.3 }}
            >
              {/* Decorative elements */}
              <div className="absolute top-4 right-4">
                <Sparkles className="text-white/30" size={24} />
              </div>
              <div className="absolute bottom-4 left-4">
                <Sparkles className="text-white/20" size={20} />
              </div>

              <div className="relative z-10 flex flex-col flex-grow">
                <QrCode className="mb-4" size={48} />
                <h4 className="font-serif text-2xl font-bold mb-2">Scan QR Code</h4>
                <p className="text-white/90 mb-6 flex-grow">
                  Scan and redeem your coupon QR codes
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full font-medium">
                  Scan Now
                  <ArrowRight size={18} />
                </div>
              </div>
            </motion.div>
          </NavLink>
        </div>

        {/* Wrapped Page Indicator Section */}
        <section className="py-12 md:py-20 bg-[hsl(35_40%_85%)] relative overflow-hidden mt-20">
          <div className="container px-6">
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 mb-4">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  Your Year in Review
                </h2>
              </div>
              <p className="font-sans text-base sm:text-lg md:text-xl text-foreground/70 mb-8">
                Discover your relationship recap
              </p>
            </motion.div>

            <motion.div
              onClick={handleWrappedClick}
              className="relative max-w-2xl mx-auto bg-gradient-to-r from-primary via-secondary to-primary rounded-3xl p-8 md:p-12 cursor-pointer overflow-hidden shadow-xl border-4 border-primary/30"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              {/* Decorative elements */}
              <div className="absolute top-4 right-4">
                <Sparkles className="text-white/30" size={32} />
              </div>
              <div className="absolute bottom-4 left-4">
                <Sparkles className="text-white/20" size={24} />
              </div>

              {/* Animated background blob */}
              <motion.div
                className="absolute inset-0 opacity-20"
                style={{
                  background: 'linear-gradient(135deg, hsl(340 65% 92%) 0%, hsl(30 50% 95%) 50%, hsl(143 30% 85%) 100%)',
                }}
                animate={{
                  x: [0, 50, -30, 0],
                  y: [0, -40, 30, 0],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Content */}
              <div className="relative z-10 text-center">
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <span className="font-sans text-sm sm:text-base text-white font-medium">
                    New: Wrapped Available
                  </span>
                </motion.div>

                <motion.h3
                  className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  Your Year in Review is ready.
                </motion.h3>
                
                <motion.p
                  className="font-serif text-lg sm:text-xl md:text-2xl text-white/90 mb-8"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Explore your relationship recap with personalized stats and memories
                </motion.p>

                <motion.div
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium hover:bg-white/30 transition-colors"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="font-sans text-base sm:text-lg md:text-xl">View Your Wrapped</span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </section>
  );
};

export default LoveNoteSection;