'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SimpleBuzzer3DProps {
  onBuzz: () => void;
  disabled?: boolean;
  canBuzz?: boolean;
  className?: string;
}

function Button3D({ onBuzz, disabled, canBuzz }: { onBuzz: () => void; disabled?: boolean; canBuzz?: boolean }) {
  const buttonRef = useRef<THREE.Group>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0.5);
  const { buzz, error } = useHapticFeedback();

  // Gentle glow animation
  useFrame((state) => {
    if (!disabled && canBuzz) {
      setGlowIntensity(0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2);
    } else {
      setGlowIntensity(0.1);
    }
  });

  const handleClick = (event: any) => {
    event.stopPropagation();
    if (!disabled && canBuzz) {
      setIsPressed(true);
      buzz();
      onBuzz();
      
      // Reset after animation
      setTimeout(() => setIsPressed(false), 200);
    } else {
      error();
    }
  };

  const buttonY = isPressed ? -0.1 : 0;
  const buttonColor = disabled || !canBuzz ? '#666666' : '#dc2626';
  const buttonEmissive = disabled || !canBuzz ? '#000000' : '#dc2626';

  return (
    <group ref={buttonRef}>
      {/* Base */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[1.8, 1.8, 0.3, 32]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Button */}
      <mesh 
        position={[0, buttonY, 0]}
        onClick={handleClick}
      >
        <cylinderGeometry args={[1.5, 1.5, 0.4, 32]} />
        <meshStandardMaterial 
          color={buttonColor}
          emissive={buttonEmissive}
          emissiveIntensity={glowIntensity}
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>

      {/* Text */}
      <Text
        position={[0, 0.21, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {disabled || !canBuzz ? 'WAIT' : 'BUZZ!'}
      </Text>
    </group>
  );
}

export function SimpleBuzzer3D({ onBuzz, disabled = false, canBuzz = true, className }: SimpleBuzzer3DProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50',
        'w-72 h-56 touch-manipulation select-none',
        className
      )}
    >
      <Canvas
        camera={{ 
          position: [0, 1.5, 2.5], 
          fov: 50
        }}
        gl={{ 
          antialias: true,
          alpha: true
        }}
        style={{ 
          background: 'transparent',
          width: '100%',
          height: '100%'
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[0, 2, 0]} intensity={0.3} />
        
        <Button3D onBuzz={onBuzz} disabled={disabled} canBuzz={canBuzz} />
      </Canvas>
    </div>
  );
}