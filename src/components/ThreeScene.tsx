"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type ThreeSceneProps = {
  activeSection: number;
  isLoading: boolean;
};

type PortraitData = {
  positions: Float32Array;
  colors: Float32Array;
};

// Reduce points on mobile for better performance
const MAX_POINTS = 18000;

const randomBetween = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const pickFromGeometry = (geometry: THREE.BufferGeometry, count: number) => {
  const source = geometry.attributes.position.array as Float32Array;
  const result = new Float32Array(count * 3);
  const vertexCount = source.length / 3;

  for (let i = 0; i < count; i += 1) {
    const index = Math.floor(Math.random() * vertexCount) * 3;
    result[i * 3] = source[index];
    result[i * 3 + 1] = source[index + 1];
    result[i * 3 + 2] = source[index + 2];
  }

  geometry.dispose();
  return result;
};

const buildWaveTarget = (count: number) => {
  const result = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const x = randomBetween(-1.4, 1.4);
    const y = randomBetween(-1.1, 1.1);
    const z = Math.sin(x * 2.2) * 0.25 + Math.cos(y * 2.8) * 0.2;
    result[i * 3] = x;
    result[i * 3 + 1] = y;
    result[i * 3 + 2] = z;
  }

  return result;
};

const buildNoiseTarget = (count: number) => {
  const result = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    result[i * 3] = randomBetween(-1.8, 1.8);
    result[i * 3 + 1] = randomBetween(-1.2, 1.2);
    result[i * 3 + 2] = randomBetween(-1.2, 1.2);
  }

  return result;
};

const loadPortraitPoints = async (): Promise<PortraitData> => {
  const image = new Image();
  image.src = "/xname.png";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to load portrait"));
  });

  const size = 240;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas not supported");

  context.drawImage(image, 0, 0, size, size);
  const data = context.getImageData(0, 0, size, size).data;

  const points: number[] = [];
  const colors: number[] = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const alpha = data[index + 3];
      if (alpha < 20) continue;

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const luma = (r + g + b) / 3;
      if (luma > 240) continue;

      const nx = (x / size - 0.5) * 1.6;
      const ny = (y / size - 0.5) * -2.0;
      const nz = (1 - luma / 255) * 0.5;
      points.push(nx, ny, nz);
      const normalized = luma / 255;
      const gray = Math.pow(normalized, 1.4);
      colors.push(gray, gray, gray);
    }
  }  const maxPoints = Math.min(MAX_POINTS, points.length / 3);
  const stride = Math.max(1, Math.floor(points.length / 3 / maxPoints));
  const result = new Float32Array(maxPoints * 3);

  for (let i = 0; i < maxPoints; i += 1) {
    const sourceIndex = i * stride * 3;
    result[i * 3] = points[sourceIndex] ?? 0;
    result[i * 3 + 1] = points[sourceIndex + 1] ?? 0;
    result[i * 3 + 2] = points[sourceIndex + 2] ?? 0;
  }

  const colorResult = new Float32Array(maxPoints * 3);
  for (let i = 0; i < maxPoints; i += 1) {
    const sourceIndex = i * stride * 3;
    colorResult[i * 3] = colors[sourceIndex] ?? 1;
    colorResult[i * 3 + 1] = colors[sourceIndex + 1] ?? 1;
    colorResult[i * 3 + 2] = colors[sourceIndex + 2] ?? 1;
  }

  return { positions: result, colors: colorResult };
};

export default function ThreeScene({ activeSection, isLoading }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameIdRef = useRef<number | null>(null);
  const activeSectionRef = useRef(activeSection);
  const isLoadingRef = useRef(isLoading);
  const hasScrolledRef = useRef(false);
  const cursorRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0, lastTime: 0 });
  const cursorSpeedRef = useRef(0);
  const lastScatterRef = useRef(0);
  const targetsRef = useRef<Float32Array[]>([]);
  const positionsRef = useRef<Float32Array>(new Float32Array(0));
  const currentTargetIndexRef = useRef(0);
  const targetChangedRef = useRef(false);
  const activeDataConnectionsRef = useRef<Array<{sourceIdx: number, targetIdx: number, age: number, lifetime: number}>>([]);
  const lastConnectionChangeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const buildingTopsRef = useRef<Array<{x: number, y: number, z: number}>>([]);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050606, 1, 200);

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 300);
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x050606, 1);
    // Force canvas to fill container
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(0), 3)
    );

    const pointsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
      vertexColors: true,
    });

    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(points);

    // Create Watch Dogs inspired cityscape with buildings around camera
    const cityGroup = new THREE.Group();
    const gridSize = 20;
    const baseSpacing = 0.6;
    const clusterSize = 3; // Buildings per cluster before larger gap
    
    const buildingTops: Array<{x: number, y: number, z: number}> = [];

    for (let x = -gridSize; x <= gridSize; x++) {
      for (let z = -gridSize; z <= gridSize; z++) {
        // Create larger gaps between clusters (streets between building groups)
        const clusterX = Math.floor(Math.abs(x) / clusterSize) % 2;
        const clusterZ = Math.floor(Math.abs(z) / clusterSize) % 2;
        
        // Larger gaps every 3-4 buildings for street effect
        if (clusterX === 1 && Math.abs(x) % clusterSize === 0) continue;
        if (clusterZ === 1 && Math.abs(z) % clusterSize === 0) continue;
        
        // Random chance for small gaps within clusters
        if (Math.random() < 0.12) continue;

        // Random building dimensions
        const width = 0.25 + Math.random() * 0.35;
        const depth = 0.25 + Math.random() * 0.35;
        const height = 0.3 + Math.random() * 2.3;
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        
        // Create edges for neon wireframe effect
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({
            color: 0x67d6ff,
            opacity: 0.08,
            transparent: true,
            linewidth: 1,
            blending: THREE.AdditiveBlending,
          })
        );
        
        const xPos = x * baseSpacing;
        const zPos = z * baseSpacing;
        const topY = height;
        
        line.position.set(xPos, height / 2, zPos);
        cityGroup.add(line);
        
        // Store building top positions for data transmission lines
        buildingTops.push({x: xPos, y: topY, z: zPos});
      }
    }
    
    // Save building tops to ref for animation loop
    buildingTopsRef.current = buildingTops;
    
    // Create placeholder for data transmission lines (will be updated in animation loop)
    const dataLinesGeometry = new THREE.BufferGeometry();
    const dataLinesMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      opacity: 0.6,
      transparent: true,
      linewidth: 1,
      blending: THREE.AdditiveBlending,
    });
    const dataLines = new THREE.LineSegments(dataLinesGeometry, dataLinesMaterial);
    cityGroup.add(dataLines);
    
    cityGroup.castShadow = true;
    cityGroup.receiveShadow = true;
    scene.add(cityGroup);

    const handleResize = () => {
      let width = container.clientWidth;
      let height = container.clientHeight;
      
      // Fallback to window dimensions if container is 0
      if (width === 0 || height === 0) {
        width = Math.max(window.innerWidth, 1);
        height = Math.max(window.innerHeight, 1);
      }
      
      // Make sure we have valid positive dimensions
      if (width > 0 && height > 0) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    
    // Retry resize multiple times on mobile to ensure proper sizing
    const resizeRetries = [
      setTimeout(() => handleResize(), 100),
      setTimeout(() => handleResize(), 300),
      setTimeout(() => handleResize(), 500),
    ];
    
    // Use ResizeObserver for better mobile support
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    const handleScroll = () => {
      if (window.scrollY > 2) {
        hasScrolledRef.current = true;
        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const handlePointerMove = (event: PointerEvent) => {
      if (isLoadingRef.current) return;
      
      const now = performance.now();
      const rect = container.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(mouseX, mouseY);
      raycaster.setFromCamera(mouse, camera);
      
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);
      
      const x = intersection.x;
      const y = intersection.y;
      
      const { lastX, lastY, lastTime } = cursorRef.current;

      if (lastTime > 0) {
        const dt = Math.max(16, now - lastTime);
        const dx = x - lastX;
        const dy = y - lastY;
        const speed = Math.sqrt(dx * dx + dy * dy) / dt;
        cursorSpeedRef.current = Math.min(1, cursorSpeedRef.current + speed * 18);
      }

      lastScatterRef.current = now;
      cursorRef.current = { x, y, lastX: x, lastY: y, lastTime: now };
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    const buildTargets = (portrait: Float32Array) => {
      const count = portrait.length / 3;
      const sphere = pickFromGeometry(
        new THREE.SphereGeometry(1.1, 32, 32),
        count
      );
      const knot = pickFromGeometry(
        new THREE.TorusKnotGeometry(0.85, 0.25, 140, 12),
        count
      );
      const box = pickFromGeometry(
        new THREE.BoxGeometry(1.5, 1.2, 1.2, 12, 12, 12),
        count
      );
      const wave = buildWaveTarget(count);
      const noise = buildNoiseTarget(count);

      targetsRef.current = [portrait, sphere, knot, box, wave, noise];
    };

    const initGeometry = (portrait: Float32Array, colors: Float32Array) => {
      positionsRef.current = portrait;
      pointsGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positionsRef.current, 3)
      );
      pointsGeometry.setAttribute(
        "color",
        new THREE.BufferAttribute(colors, 3)
      );
      pointsGeometry.computeBoundingSphere();
    };

    const boot = async () => {
      try {
        const portrait = await loadPortraitPoints();
        initGeometry(portrait.positions, portrait.colors);
        buildTargets(portrait.positions);
      } catch (error) {
        const fallback = pickFromGeometry(
          new THREE.SphereGeometry(1.1, 32, 32),
          MAX_POINTS
        );
        const fallbackColors = new Float32Array((fallback.length / 3) * 3);
        fallbackColors.fill(1);
        initGeometry(fallback, fallbackColors);
        buildTargets(fallback);
      }
    };

    boot();

    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();
      const targets = targetsRef.current;
      const activeIndex = Math.min(
        activeSectionRef.current,
        Math.max(targets.length - 1, 0)
      );
      const hasScrolled = hasScrolledRef.current;
      const targetIndex = hasScrolled ? activeIndex : 0;

      const target = targets[targetIndex];
      const positions = positionsRef.current;

      // Animate city: city moves chaotically while camera and points stay fixed
      const spiralRadius = 8;
      
      // City moves chaotically in opposite direction of original camera movement
      // This creates the same effect as moving camera but keeps camera and points fixed
      cityGroup.position.x = -(Math.sin(time * 0.0208) * 4 + Math.cos(time * 0.0125) * 3);
      cityGroup.position.y = -(3.5 + Math.sin(time * 0.025) * 1.2 + Math.cos(time * 0.0167) * 1);
      cityGroup.position.z = Math.sin(time * 0.015) * 4;
      
      // Add the original spiral to city movement
      cityGroup.position.x += Math.cos(time * 0.01) * spiralRadius;
      cityGroup.position.z += Math.sin(time * 0.01) * spiralRadius;
      
      // Rotate city relative to camera
      cityGroup.rotation.y = time * 0.025;
      cityGroup.rotation.x = Math.sin(time * 0.0125) * 0.2;
      
      // Fixed camera position looking at origin
      camera.position.set(0, 0, 4);
      camera.lookAt(0, 0, 0);
      
      // Fixed points at origin
      points.position.set(0, 0, 0);
      points.quaternion.identity();
      
      // Pulse the city lines opacity for neon effect
      const cityOpacity = 0.025;
      cityGroup.children.forEach((child: any) => {
        if (child.material) {
          child.material.opacity = cityOpacity;
        }
      });

      if (target && positions.length === target.length) {
        const ease = isLoadingRef.current ? 0.02 : 0.06;
        for (let i = 0; i < positions.length; i += 1) {
          positions[i] += (target[i] - positions[i]) * ease;
        }
        const wobble = hasScrolled
            ? activeIndex === 0
              ? 0.0022
              : 0.0014
            : 0.00018;
        const cursorIntensity = !isLoadingRef.current ? cursorSpeedRef.current : 0;
        const cursorOffset = cursorIntensity * 0.06;
        const cursorX = cursorRef.current.x;
        const cursorY = cursorRef.current.y;
        const influenceRadius = 0.455;
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i];
          const y = positions[i + 1];
          positions[i] += Math.sin(time * 1.2 + y * 4) * wobble;
          positions[i + 1] += Math.cos(time * 1.1 + x * 3.5) * wobble;
          if (cursorOffset > 0.00001 && !isLoadingRef.current) {
            const dx = x - cursorX;
            const dy = y - cursorY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < influenceRadius) {
              const falloff = 1 - distance / influenceRadius;
              const push = falloff * falloff * cursorOffset;
              positions[i] += dx * push;
              positions[i + 1] += dy * push;
              positions[i + 2] += push * 0.6;
            }
          }
        }
        const attribute = pointsGeometry.getAttribute("position");
        if (attribute) attribute.needsUpdate = true;
      }

      points.rotation.set(0, 0, 0);
      currentTargetIndexRef.current = targetIndex;
      
      // Mark that target has changed if we move away from portrait
      if (targetIndex !== 0) {
        targetChangedRef.current = true;
      }

      pointsMaterial.opacity = isLoadingRef.current ? 0.7 : 0.98;

      cursorSpeedRef.current *= 0.92;

      renderer.render(scene, camera);
      frameIdRef.current = requestAnimationFrame(animate);
    };

    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      resizeObserver.disconnect();
      resizeRetries.forEach(timeout => clearTimeout(timeout));
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      renderer.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full overflow-hidden" />;
}
