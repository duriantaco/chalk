// src/components/PageTransition.js
import React from 'react';
import { motion } from 'framer-motion'; 

const PageTransition = ({ children, transitionKey }) => {
  const pageVariants = {
    initial: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.3 }
    },
    in: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    },
    out: {
      opacity: 0,
      x: 20,
      transition: { duration: 0.3, ease: "easeIn" }
    }
  };

  return (
    <motion.div
      key={transitionKey}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;