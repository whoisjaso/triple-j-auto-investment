import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, Float, Sparkles, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Gold material configuration
const goldMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#D4AF37'),
  metalness: 1,
  roughness: 0.15,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
  emissive: new THREE.Color('#B8941F'),
  emissiveIntensity: 0.1,
});

const darkMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#000000'),
  metalness: 0.8,
  roughness: 0.4,
});

// 3D Logo Mesh Component
interface Logo3DProps {
  scale?: number;
  autoRotate?: boolean;
}

const Logo3DMesh: React.FC<Logo3DProps> = ({ scale = 1, autoRotate = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (groupRef.current && autoRotate) {
      // Gentle floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      
      // Slow rotation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  // Create the shield shape using a custom geometry
  const shieldGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const width = 1.5;
    const height = 2;
    const curve = 0.3;

    // Draw shield
    shape.moveTo(0, height / 2);
    shape.bezierCurveTo(width / 2, height / 2, width / 2, height / 4, width / 2, 0);
    shape.bezierCurveTo(width / 2, -height / 3, width / 4, -height / 2, 0, -height / 2 - curve);
    shape.bezierCurveTo(-width / 4, -height / 2, -width / 2, -height / 3, -width / 2, 0);
    shape.bezierCurveTo(-width / 2, height / 4, -width / 2, height / 2, 0, height / 2);

    const extrudeSettings = {
      steps: 2,
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelOffset: 0,
      bevelSegments: 5,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  // TJ Monogram geometry
  const tGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const w = 0.4;
    const h = 0.6;
    const t = 0.08;

    shape.moveTo(-w / 2, h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(w / 2, h / 2 - t);
    shape.lineTo(t / 2, h / 2 - t);
    shape.lineTo(t / 2, -h / 2);
    shape.lineTo(-t / 2, -h / 2);
    shape.lineTo(-t / 2, h / 2 - t);
    shape.lineTo(-w / 2, h / 2 - t);
    shape.lineTo(-w / 2, h / 2);

    return new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    });
  }, []);

  const jGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const w = 0.35;
    const h = 0.6;
    const t = 0.08;

    shape.moveTo(-t / 2, h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(w / 2, h / 2 - t);
    shape.lineTo(t / 2, h / 2 - t);
    shape.lineTo(t / 2, -h / 3);
    shape.bezierCurveTo(t / 2, -h / 2 - 0.1, -t / 2, -h / 2 - 0.1, -w / 2, -h / 2);
    shape.lineTo(-w / 2 + t, -h / 2 + t / 2);
    shape.bezierCurveTo(-t / 2, -h / 3, -t / 2, -h / 3, -t / 2, h / 2);

    return new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    });
  }, []);

  return (
    <group ref={groupRef} scale={scale}>
      {/* Main shield */}
      <mesh geometry={shieldGeometry} material={darkMaterial} castShadow receiveShadow>
        <meshStandardMaterial
          color="#000000"
          metalness={0.9}
          roughness={0.3}
          envMapIntensity={1}
        />
      </mesh>

      {/* Gold border */}
      <mesh geometry={shieldGeometry} scale={[1.05, 1.05, 0.9]} material={goldMaterial} castShadow />

      {/* TJ Monogram - T */}
      <mesh
        geometry={tGeometry}
        material={goldMaterial}
        position={[-0.15, 0.1, 0.15]}
        castShadow
      />

      {/* TJ Monogram - J */}
      <mesh
        geometry={jGeometry}
        material={goldMaterial}
        position={[0.15, 0.1, 0.15]}
        castShadow
      />

      {/* Crown on top */}
      <group position={[0, 0.85, 0]}>
        <mesh castShadow>
          <coneGeometry args={[0.3, 0.2, 5]} />
          <meshStandardMaterial
            color="#D4AF37"
            metalness={1}
            roughness={0.15}
            emissive="#B8941F"
            emissiveIntensity={0.2}
          />
        </mesh>
        {/* Crown jewels */}
        {[[-0.2, 0.05], [0, 0.08], [0.2, 0.05]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0]}>
            <sphereGeometry args={[0.04]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive="#FFFFFF"
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
      </group>

      {/* Sparkles */}
      <Sparkles
        count={20}
        scale={3}
        size={2}
        speed={0.4}
        color="#D4AF37"
      />
    </group>
  );
};

// Scene setup
const Scene: React.FC<Logo3DProps> = (props) => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        intensity={1.5}
        castShadow
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#D4AF37" />
      <Environment preset="city" />
      
      <Float
        speed={2}
        rotationIntensity={0.5}
        floatIntensity={0.5}
      >
        <Logo3DMesh {...props} />
      </Float>
    </>
  );
};

// Main component
interface LuxuryLogo3DProps {
  className?: string;
  scale?: number;
  autoRotate?: boolean;
}

export const LuxuryLogo3D: React.FC<LuxuryLogo3DProps> = ({
  className = '',
  scale = 1,
  autoRotate = true,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-20 h-20 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`${className}`} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        shadows
        dpr={[1, 2]}
      >
        <Scene scale={scale} autoRotate={autoRotate} />
      </Canvas>
    </div>
  );
};

export default LuxuryLogo3D;
