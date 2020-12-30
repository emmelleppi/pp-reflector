import {
  Box,
  Environment,
  OrbitControls,
  Plane,
  useTexture,
  Stats,
  Sphere,
} from "@react-three/drei";
import React, { Suspense, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Canvas, useResource, useFrame } from "react-three-fiber";
import { useReflector } from "./reflector";
import "./styles.css";
import usePostprocessing from "./use-postprocessing";
import { ReflectorMaterial } from "./reflector-material";
import { RepeatWrapping } from "three";

function Totem({material,...props}) {
  const ref = useRef()
  const [delay] = useState(() => Math.random() * Math.PI * 2)
  useFrame(({clock}) => {
    const time = clock.getElapsedTime()
    const sinSlow = Math.sin(delay + (time/4))
    const sin = Math.sin(delay + (time*2))
    const cos = Math.cos(delay + (time*2))
    ref.current.position.set(1.4*sin, (1+sinSlow) ,1.4*cos)
  })
  
  return (
    <group {...props}>
      <Box castShadow args={[1, 6, 1]} material={material}/>
        <meshPhysicalMaterial
          metalness={0.95}
          roughness={0.2}
        />
      <Sphere castShadow ref={ref} args={[0.2,64,64]} material={material} />
    </group>
  )
} 

function Scene() {
  const material = useResource()
  const [
    meshRef,
    textureMatrix,
    renderPass,
    savePass,
    lambdaPassBefore,
    lambdaPassAfter,
    blurPass,
    depthPass
  ] = useReflector({
    color: 0xffffff,
    textureWidth: 512,
    textureHeight: 512,
    clipBias: 0,
  });
  const textures = useTexture([
    "/BASE.jpg",
    "/AO.jpg",
    "/HEIGHT.png",
    "/NORMAL.jpg",
    "/ROUGHNESS.jpg",
  ]);
  useEffect(() => {
    textures.forEach((x) => {
      x.wrapS = x.wrapT = RepeatWrapping;
      x.repeat.set(16, 16);
    });
  });
  usePostprocessing([
    lambdaPassBefore,
    renderPass,
    depthPass,
    blurPass,
    savePass,
    lambdaPassAfter,
  ]);
  return (
    <group position={[0, 0, -5]}>
      <group>
          <meshPhysicalMaterial
            ref={material}
            metalness={0.95}
            roughness={0.2}
          />
          <Totem position-x={-4} material={material.current}/>
          <Totem material={material.current}/>
          <Totem position-x={4} material={material.current}/>
      </group>
      <Plane
        receiveShadow
        ref={meshRef}
        args={[100, 100, 32, 32]}
        position-y={-1.5}
        rotation-x={-Math.PI / 2}
      >
        <ReflectorMaterial
          metalness={0.8}
          roughness={0.1}
          map={textures[0]}
          aoMap={textures[1]}
          displacementMap={textures[2]}
          normalMap={textures[3]}
          normalScale={[0.2,0.2]}
          roughnessMap={textures[4]}
          textureMatrix={textureMatrix}
          tDiffuse={savePass.renderTarget.texture}
        />
      </Plane>
    </group>
  );
}

function App() {
  return (
    <>
      <Canvas
        concurrent
        shadowMap
        colorManagement
        camera={{ position: [0, 0, 5], far: 100, near: 0.1 }}
        gl={{
          powerPreference: "high-performance",
          alpha: false, antialias: false, stencil: false, depth: false 
        }}
      >
        <fog attach="fog" args={["#020202", 15, 30]} />
        <color attach="background" args={["#020202"]} />
        <spotLight position={[20, 20, 10]} intensity={4} castShadow angle={Math.PI/3} penumbra={1} />
        <ambientLight intensity={0.3}/>
        <Suspense fallback={null}>
          <Scene />
          <Environment files="studio_small_02_1k.hdr" />
        </Suspense>
        <OrbitControls />
      </Canvas>
      <Stats/>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
