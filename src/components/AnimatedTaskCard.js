// src/components/AnimatedTaskCard.js
import React from 'react';
import { motion } from 'framer-motion';

const AnimatedTaskCard = ({ children, priority, isCompleted, isDragging }) => {
  const getAnimationVariants = () => {
    const baseVariants = {
      initial: { 
        scale: 0.96, 
        y: 20, 
        opacity: 0 
      },
      animate: { 
        scale: 1, 
        y: 0, 
        opacity: 1,
        transition: { 
          type: "spring", 
          stiffness: 300, 
          damping: 20,
          mass: 0.8,
        } 
      },
      hover: { 
        y: -5, 
        scale: 1.02,
        boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
        transition: { 
          type: "spring", 
          stiffness: 400, 
          damping: 10 
        } 
      },
      drag: {
        scale: 1.05,
        boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.1)",
        zIndex: 100,
      },
      exit: {
        scale: 0.6,
        opacity: 0,
        transition: { duration: 0.2 }
      }
    };

    switch(priority) {
      case 'high':
        baseVariants.hover.boxShadow = "0px 5px 20px rgba(239, 68, 68, 0.3)";
        break;
      case 'medium':
        baseVariants.hover.boxShadow = "0px 5px 20px rgba(245, 158, 11, 0.3)";
        break;
      case 'low':
        baseVariants.hover.boxShadow = "0px 5px 20px rgba(16, 185, 129, 0.3)";
        break;
      default:
        break;
    }

    if (isCompleted) {
      baseVariants.animate.scale = 0.98;
      baseVariants.hover.scale = 1;
      baseVariants.hover.y = -2;
    }

    return baseVariants;
  };

  const variants = getAnimationVariants();

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileDrag="drag"
      exit="exit"
      layout
      layoutId={`task-card-${Math.random()}`}
      style={{
        width: "100%",
        zIndex: isDragging ? 100 : 10
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedTaskCard;