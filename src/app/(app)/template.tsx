"use client";

// Płynne przejście między stronami aplikacji: każda strona wjeżdża lekko z dołu i rozjaśnia się.
// template.tsx montuje się od nowa przy każdej zmianie strony (layout zostaje, więc menu się nie przeładowuje).
// Tylko opacity i y: po animacji Motion zostawia transform: none, więc okienka „fixed” w środku działają normalnie.
import { motion } from "motion/react";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div className="flex flex-1 flex-col gap-5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.8 }}>
      {children}
    </motion.div>
  );
}
