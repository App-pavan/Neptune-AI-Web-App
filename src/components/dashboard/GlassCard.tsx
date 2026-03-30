import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export const GlassCard = ({ children, className = "", hover = false, delay = 0 }: GlassCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className={cn(
      "glass rounded-2xl",
      hover && "glass-hover cursor-pointer",
      className
    )}
  >
    {children}
  </motion.div>
);
