'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface BuzzerButton3DProps {
  onBuzz: () => void;
  disabled?: boolean;
  canBuzz?: boolean;
  className?: string;
}

function Button3D({ onBuzz, disabled, canBuzz }: { onBuzz: () => void; disabled?: boolean; canBuzz?: boolean }) {
  const buttonRef = useRef<THREE.Group>(null);
  const baseRef = useRef<THREE.Mesh>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0.5);
  const { buzz, error } = useHapticFeedback();
  const { camera, raycaster, scene } = useThree();

  // Animation loop for glow effect
  useFrame((state) => {
    if (!disabled && canBuzz) {
      setGlowIntensity(0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3);
    } else {
      setGlowIntensity(0.1);
    }
  });

  const handlePointerDown = (event: THREE.Event) => {
    event.stopPropagation();
    if (!disabled && canBuzz) {
      setIsPressed(true);
      buzz();
      onBuzz();
      
      // Reset after animation
      setTimeout(() => setIsPressed(false), 150);
    } else {
      error();
    }
  };

  const handlePointerOver = () => {
    if (!disabled && canBuzz) {
      setIsHovered(true);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    document.body.style.cursor = 'default';
  };

  const buttonColor = disabled || !canBuzz ? '#666666' : '#dc2626';
  const buttonEmissive = disabled || !canBuzz ? '#000000' : `hsl(0, 100%, ${30 + glowIntensity * 20}%)`;
  const buttonY = isPressed ? -0.1 : (isHovered ? 0.05 : 0);

  return (
    <group ref={buttonRef} position={[0, 0, 0]}>
      {/* Base/Housing */}
      <mesh ref={baseRef} position={[0, -0.4, 0]}>
        <cylinderGeometry args={[1.4, 1.4, 0.3, 32]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Button */}
      <group position={[0, buttonY, 0]}>
        <mesh
          onPointerDown={handlePointerDown}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <cylinderGeometry args={[1.1, 1.1, 0.4, 32]} />
          <meshStandardMaterial 
            color={buttonColor}
            emissive={buttonEmissive}
            emissiveIntensity={glowIntensity}
            metalness={0.1}
            roughness={0.3}
          />
        </mesh>

        {/* Button Text */}
        <Text
          position={[0, 0.21, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {disabled || !canBuzz ? 'WAIT' : 'BUZZ!'}
        </Text>

      </group>
    </group>
  );
}

function Scene({ onBuzz, disabled, canBuzz }: { onBuzz: () => void; disabled?: boolean; canBuzz?: boolean }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 2, 0]} intensity={0.3} color="#ffffff" />
      
      {/* Button */}
      <Button3D onBuzz={onBuzz} disabled={disabled} canBuzz={canBuzz} />
    </>
  );
}

export function BuzzerButton3D({ onBuzz, disabled = false, canBuzz = true, className }: BuzzerButton3DProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Prevent SSR issues with Three.js
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50',
        'w-64 h-64 touch-manipulation select-none',
        className
      )}
    >
      <Canvas
        camera={{ 
          position: [0, 2, 5], 
          fov: 35,
          near: 0.1,
          far: 100
        }}
        shadows
        gl={{ 
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1
        }}
        style={{ 
          background: 'transparent',
          width: '100%',
          height: '100%'
        }}
      >
        <Scene onBuzz={onBuzz} disabled={disabled} canBuzz={canBuzz} />
      </Canvas>
    </div>
  );
}