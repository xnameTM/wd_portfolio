"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const POINT_COUNT = 7000;

const shapeNames = [
  "portrait",
  "sphere",
  "torus",
  "knot",
  "cube",
  "ring",
] as const;

export type ShapeName = (typeof shapeNames)[number];

type WatchDogsSceneProps = {
  activeShape: ShapeName;
  imageUrl: string;
};

const backgroundColor = 0x050606;
const accentColor = 0x67d6ff;

const buildFromGeometry = (
  geometry: THREE.BufferGeometry,
  count: number,
  scale: number
) => {
  const positions = new Float32Array(count * 3);
  const attribute = geometry.getAttribute("position");
  const total = attribute.count;

  for (let i = 0; i < count; i += 1) {
    const index = Math.floor(Math.random() * total);
    positions[i * 3] = attribute.getX(index) * scale;
    positions[i * 3 + 1] = attribute.getY(index) * scale;
    positions[i * 3 + 2] = attribute.getZ(index) * scale;
  }

  return positions;
};

const buildShapePositions = (shape: ShapeName, count: number) => {
  switch (shape) {
    case "sphere": {
      const geometry = new THREE.SphereGeometry(1.4, 32, 32);
      const positions = buildFromGeometry(geometry, count, 1.1);
      geometry.dispose();
      return positions;
    }
    case "torus": {
      const geometry = new THREE.TorusGeometry(1.1, 0.4, 30, 120);
      const positions = buildFromGeometry(geometry, count, 1.1);
      geometry.dispose();
      return positions;
    }
    case "knot": {
      const geometry = new THREE.TorusKnotGeometry(0.9, 0.3, 180, 24);
      const positions = buildFromGeometry(geometry, count, 1.2);
      geometry.dispose();
      return positions;
    }
    case "cube": {
      const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5, 10, 10, 10);
      const positions = buildFromGeometry(geometry, count, 1.1);
      geometry.dispose();
      return positions;
    }
    case "ring": {
      const geometry = new THREE.RingGeometry(0.7, 1.5, 64, 1);
      const positions = buildFromGeometry(geometry, count, 1.4);
      geometry.dispose();
      return positions;
    }
    default:
      return new Float32Array(count * 3);
  }
};

const createPortraitPositions = async (imageUrl: string, count: number) => {
  const image = new Image();
  image.src = imageUrl;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to load image"));
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const maxSize = 180;
  const scale = maxSize / Math.max(image.width, image.height);
  const width = Math.max(1, Math.floor(image.width * scale));
  const height = Math.max(1, Math.floor(image.height * scale));

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);

  const data = ctx.getImageData(0, 0, width, height).data;
  const positions = new Float32Array(count * 3);
  let pointer = 0;
  const centerX = width / 2;
  const centerY = height / 2;
  const step = 2;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3] / 255;
      if (alpha < 0.2) continue;

      const brightness =
        (data[index] + data[index + 1] + data[index + 2]) / (3 * 255);

      if (Math.random() > 0.55) continue;

      positions[pointer] = (x - centerX) * 0.02;
      positions[pointer + 1] = -(y - centerY) * 0.02;
      positions[pointer + 2] = (brightness - 0.5) * 0.6;
      pointer += 3;

      if (pointer >= positions.length) break;
    }
    if (pointer >= positions.length) break;
  }

  for (let i = pointer; i < positions.length; i += 3) {
    positions[i] = (Math.random() - 0.5) * 2.2;
    positions[i + 1] = (Math.random() - 0.5) * 2.2;
    positions[i + 2] = (Math.random() - 0.5) * 2.2;
  }

  return positions;
};

export default function WatchDogsScene({ activeShape, imageUrl }: WatchDogsSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameIdRef = useRef<number | null>(null);
  const targetPositionsRef = useRef<Float32Array | null>(null);
  const positionsRef = useRef<Float32Array | null>(null);
  const portraitPositionsRef = useRef<Float32Array | null>(null);
  const updateTargetRef = useRef<((shape: ShapeName) => void) | null>(null);
  const shapeCacheRef = useRef<Map<ShapeName, Float32Array>>(new Map());

  const activeShapeSafe = useMemo(() => {
    return shapeNames.includes(activeShape) ? activeShape : "portrait";
  }, [activeShape]);

  useEffect(() => {
    updateTargetRef.current?.(activeShapeSafe);
  }, [activeShapeSafe]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    scene.fog = new THREE.Fog(backgroundColor, 4, 12);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 40);
    camera.position.set(0, 0.1, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const positions = new Float32Array(POINT_COUNT * 3);
    const targetPositions = new Float32Array(POINT_COUNT * 3);
    positionsRef.current = positions;
    targetPositionsRef.current = targetPositions;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: accentColor,
      size: 0.035,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const networkGeometry = new THREE.BufferGeometry();
    const networkCount = 120;
    const networkPositions = new Float32Array(networkCount * 2 * 3);
    for (let i = 0; i < networkCount * 2; i += 1) {
      networkPositions[i * 3] = (Math.random() - 0.5) * 8;
      networkPositions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      networkPositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    networkGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(networkPositions, 3)
    );
    const networkMaterial = new THREE.LineBasicMaterial({
      color: 0x2b9aff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const networkLines = new THREE.LineSegments(
      networkGeometry,
      networkMaterial
    );
    scene.add(networkLines);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(2, 2, 3);
    scene.add(dirLight);

    const handleResize = () => {
      const { clientWidth, clientHeight } = container;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const setTargetPositions = (shape: ShapeName) => {
      if (!positionsRef.current || !targetPositionsRef.current) return;

      if (shape === "portrait") {
        if (portraitPositionsRef.current) {
          targetPositionsRef.current.set(portraitPositionsRef.current);
        }
        return;
      }

      const cached = shapeCacheRef.current.get(shape);
      if (cached) {
        targetPositionsRef.current.set(cached);
        return;
      }

      const nextPositions = buildShapePositions(shape, POINT_COUNT);
      shapeCacheRef.current.set(shape, nextPositions);
      targetPositionsRef.current.set(nextPositions);
    };

    updateTargetRef.current = setTargetPositions;

    const primePositions = async () => {
      try {
        const portraitPositions = await createPortraitPositions(
          imageUrl,
          POINT_COUNT
        );
        portraitPositionsRef.current = portraitPositions;
        positions.set(portraitPositions);
        targetPositions.set(portraitPositions);
        geometry.attributes.position.needsUpdate = true;
        setTargetPositions(activeShapeSafe);
      } catch {
        const fallback = buildShapePositions("sphere", POINT_COUNT);
        positions.set(fallback);
        targetPositions.set(fallback);
        geometry.attributes.position.needsUpdate = true;
      }
    };

    void primePositions();

    const animate = () => {
      const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
      const current = positionsRef.current;
      const target = targetPositionsRef.current;

      if (current && target) {
        for (let i = 0; i < current.length; i += 1) {
          current[i] += (target[i] - current[i]) * 0.06;
        }
        attr.needsUpdate = true;
      }

      points.rotation.y += 0.0015;
      points.rotation.x += 0.0007;

      networkLines.rotation.y -= 0.0008;
      networkLines.rotation.x += 0.0005;
      networkMaterial.opacity = 0.2 + Math.sin(Date.now() * 0.001) * 0.1;

      renderer.render(scene, camera);
      frameIdRef.current = requestAnimationFrame(animate);
    };

    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
      }
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      networkGeometry.dispose();
      networkMaterial.dispose();
      renderer.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeShapeSafe, imageUrl]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
