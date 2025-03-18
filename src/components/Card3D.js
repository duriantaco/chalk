// src/components/Card3D.js
import React, { useState, useRef, useEffect } from 'react';

const Card3D = ({ children, priority = 'normal', className = '', onClick }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const calculateTilt = () => {
    if (!isHovered || !cardRef.current) return { x: 0, y: 0 };
    
    const card = cardRef.current;
    const cardRect = card.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    
    const percentX = (mousePosition.x - cardCenterX) / (cardRect.width / 2) * 50;
    const percentY = (mousePosition.y - cardCenterY) / (cardRect.height / 2) * 50;
    
    const maxRotation = 5;
    const tiltX = -Math.max(-maxRotation, Math.min(maxRotation, percentY / 5));
    const tiltY = Math.max(-maxRotation, Math.min(maxRotation, percentX / 5));
    
    return { x: tiltX, y: tiltY };
  };

  const handleMouseMove = (e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (isHovered) {
      window.addEventListener('mousemove', handleMouseMove);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHovered]);

  const tilt = calculateTilt();

  const priorityClass = `card-3d-${priority}`;

  return (
    <div 
      className={`card-3d-container ${className}`}
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div 
        className={`card-3d ${priorityClass}`}
        style={{
          transform: isHovered 
            ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)` 
            : 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Card3D;