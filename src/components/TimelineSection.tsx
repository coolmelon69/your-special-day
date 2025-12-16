import { motion } from "framer-motion";
import { MapPin, Clock, Coffee, Utensils, Camera, Music, Heart } from "lucide-react";

const itinerary = [
  {
    time: "9:00 AM",
    title: "Breakfast in Bed",
    description: "Wake up to your favorite breakfast with fresh flowers and orange juice",
    icon: Coffee,
    isActive: true,
  },
  {
    time: "11:00 AM",
    title: "Flower Market Visit",
    description: "Pick out the most beautiful bouquet from the local flower market",
    icon: Heart,
    isActive: false,
  },
  {
    time: "1:00 PM",
    title: "Surprise Lunch Date",
    description: "Your favorite restaurant with a special birthday menu",
    icon: Utensils,
    isActive: false,
  },
  {
    time: "3:30 PM",
    title: "Photo Session",
    description: "Capturing beautiful moments at our favorite spot in the park",
    icon: Camera,
    isActive: false,
  },
  {
    time: "6:00 PM",
    title: "Sunset Concert",
    description: "Live music at the rooftop venue with the best views",
    icon: Music,
    isActive: false,
  },
  {
    time: "9:00 PM",
    title: "Starlight Dinner",
    description: "Elegant candlelit dinner with a stunning city view",
    icon: Utensils,
    isActive: false,
  },
];

const TimelineSection = () => {
  return (
    <section className="py-20 md:py-32 bg-gradient-romantic">
      <div className="container px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <MapPin className="mx-auto mb-4 text-primary" size={36} />
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Your <span className="text-gradient-romantic">Special Day</span> Itinerary
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            A carefully planned adventure just for you
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {itinerary.map((item, index) => (
            <motion.div
              key={index}
              className="relative flex gap-6 pb-12 last:pb-0"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              {/* Timeline line */}
              {index !== itinerary.length - 1 && (
                <div className="absolute left-[27px] top-14 w-0.5 h-full bg-border" />
              )}

              {/* Icon circle */}
              <motion.div
                className={`relative z-10 flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center ${
                  item.isActive
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-card text-muted-foreground border-2 border-border"
                }`}
                whileHover={{ scale: 1.1 }}
              >
                <item.icon size={24} />
              </motion.div>

              {/* Content card */}
              <motion.div
                className={`flex-1 bg-card rounded-2xl p-6 shadow-lg ${
                  item.isActive ? "ring-2 ring-primary shadow-romantic" : ""
                }`}
                whileHover={{ y: -4 }}
              >
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm font-medium">
                    <Clock size={14} />
                    {item.time}
                  </span>
                  {item.isActive && (
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium animate-pulse-soft">
                      Coming up!
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground mb-4">{item.description}</p>
                
                {/* Map placeholder */}
                <div className="bg-muted rounded-xl h-32 flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="mx-auto mb-2" size={24} />
                    <span className="text-sm">Map placeholder</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;