import { motion } from "framer-motion";
import { Heart, Quote, Sparkles } from "lucide-react";

const friendWishes = [
  { name: "Sarah", message: "Happy birthday! May all your dreams come true! 🎂" },
  { name: "Mike", message: "Wishing you the happiest of birthdays! 🎉" },
  { name: "Emma", message: "You deserve all the happiness in the world! 💕" },
  { name: "David", message: "Have an amazing day, birthday star! ⭐" },
  { name: "Lisa", message: "Cheers to another year of being awesome! 🥳" },
  { name: "Tom", message: "May your special day be as wonderful as you! 🌟" },
];

const LoveNoteSection = () => {
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

        {/* Love Letter */}
        <motion.div
          className="max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative bg-card rounded-3xl p-8 md:p-12 shadow-xl"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23f4a5b8' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            }}
          >
            <Quote className="text-primary/30 mb-4" size={48} />
            
            <div className="font-serif text-lg md:text-xl leading-relaxed text-foreground/90 space-y-4">
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
            </div>
          </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
      </div>
    </section>
  );
};

export default LoveNoteSection;