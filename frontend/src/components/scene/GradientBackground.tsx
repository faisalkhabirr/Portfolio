import * as THREE from 'three';
import { useRef } from 'react';

export function GradientBackground() {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef} position={[0, 0, -20]} scale={[120, 120, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        uniforms={{
          uColorInner: { value: new THREE.Color('#f8fafc') }, // Bright soft white-grey core on the left/center
          uColorOuter: { value: new THREE.Color('#8b9bb4') }, // Sophisticated cool-grey vignette on the edges/right
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform vec3 uColorInner;
          uniform vec3 uColorOuter;
          void main() {
            // Position the gradient center slightly to the left (x: 0.35) behind your text/UI elements
            vec2 center = vec2(0.35, 0.5);
            float dist = distance(vUv, center);
            
            // Smooth radial vignette falloff matching the Locomotive aesthetic
            float factor = smoothstep(0.0, 0.75, dist * 1.1);
            vec3 color = mix(uColorInner, uColorOuter, factor);
            
            gl_FragColor = vec4(color, 1.0);
          }
        `}
        depthWrite={false}
      />
    </mesh>
  );
}