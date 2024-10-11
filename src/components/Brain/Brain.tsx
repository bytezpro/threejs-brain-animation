import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  BoxGeometry,
  ShaderMaterial,
  Color,
  Vector2,
  Vector3,
  Raycaster,
  Object3D,
  MathUtils,
  LoadingManager,
  Mesh,
  BufferGeometry,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Stats from 'stats.js';
import gsap from 'gsap';

import vertexShader from '../../shaders/brain.vertex.glsl';
import fragmentShader from '../../shaders/brain.fragment.glsl';
import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh';
import brainModel from '../../static/brain.glb';

interface BrainAnimationProps {
  width: number;
  height: number;
}

const BrainAnimation: React.FC<BrainAnimationProps> = React.memo(({ width, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<Stats | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  const threeRef = useRef({
    scene: null as Scene | null,
    camera: null as PerspectiveCamera | null,
    renderer: null as WebGLRenderer | null,
    raycaster: null as Raycaster | null,
    brain: null as Mesh | null,
    instancedMesh: null as InstancedUniformsMesh | null,
  });

  const colors = useMemo(
    () => [new Color(0x963cbd), new Color(0xff6f61), new Color(0xc5299b), new Color(0xfeae51)],
    [],
  );

  const uniformsRef = useRef({
    uHover: 0,
  });

  const isMobileRef = useRef(false);
  const mouseRef = useRef(new Vector2());
  const intersectsRef = useRef<any[]>([]);
  const hoverRef = useRef(false);
  const pointRef = useRef(new Vector3());
  const loadingManagerRef = useRef<LoadingManager | null>(null);
  const gltfLoaderRef = useRef<GLTFLoader | null>(null);

  const initThreeApp = useCallback(() => {
    if (isInitializedRef.current || threeRef.current.renderer) return;

    isInitializedRef.current = true;

    threeRef.current.scene = new Scene();
    threeRef.current.camera = new PerspectiveCamera(75, width / height, 0.1, 100);
    threeRef.current.camera.position.set(0, 0, 1.2);

    threeRef.current.renderer = new WebGLRenderer({
      alpha: true,
      antialias: window.devicePixelRatio === 1,
    });

    if (containerRef.current) {
      containerRef.current.appendChild(threeRef.current.renderer.domElement);
    }

    threeRef.current.renderer.setSize(width, height);
    threeRef.current.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));

    threeRef.current.raycaster = new Raycaster();

    loadingManagerRef.current = new LoadingManager();
    loadingManagerRef.current.onLoad = () => {
      document.documentElement.classList.add('model-loaded');
    };
    gltfLoaderRef.current = new GLTFLoader(loadingManagerRef.current);

    checkMobile();

    loadModel().then(() => {
      addListeners();
      animate();
    });
  }, [width, height]);

  const animate = useCallback(() => {
    if (!isInitializedRef.current) return;

    if (statsRef.current) statsRef.current.begin();
    update();
    render();
    if (statsRef.current) statsRef.current.end();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const update = useCallback(() => {
    if (threeRef.current.camera) {
      threeRef.current.camera.lookAt(0, 0, 0);
      threeRef.current.camera.position.z = isMobileRef.current ? 2.3 : 1.2;
    }
  }, []);

  const render = useCallback(() => {
    if (threeRef.current.renderer && threeRef.current.scene && threeRef.current.camera) {
      threeRef.current.renderer.render(threeRef.current.scene, threeRef.current.camera);
    }
  }, []);

  const loadModel = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (gltfLoaderRef.current && threeRef.current.scene) {
        const srcPath = brainModel;
        gltfLoaderRef.current.load(srcPath, (gltf) => {
          const brainMesh = gltf.scene.children[0] as Mesh;
          threeRef.current.brain = brainMesh;

          const geometry = new BoxGeometry(0.004, 0.004, 0.004, 1, 1, 1);
          const material = new ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            wireframe: true,
            uniforms: {
              uPointer: { value: new Vector3() },
              uColor: { value: new Color() },
              uRotation: { value: 0 },
              uSize: { value: 0 },
              uHover: { value: uniformsRef.current.uHover },
            },
          });

          if (brainMesh.geometry instanceof BufferGeometry) {
            threeRef.current.instancedMesh = new InstancedUniformsMesh(
              geometry,
              material,
              brainMesh.geometry.attributes.position.count,
            );
            threeRef.current.scene!.add(threeRef.current.instancedMesh);

            const dummy = new Object3D();
            const positions = brainMesh.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
              dummy.position.set(positions[i + 0], positions[i + 1], positions[i + 2]);

              dummy.updateMatrix();

              threeRef.current.instancedMesh.setMatrixAt(i / 3, dummy.matrix);

              threeRef.current.instancedMesh.setUniformAt(
                'uRotation',
                i / 3,
                MathUtils.randFloat(-1, 1),
              );

              threeRef.current.instancedMesh.setUniformAt(
                'uSize',
                i / 3,
                MathUtils.randFloat(0.3, 3),
              );

              const colorIndex = MathUtils.randInt(0, colors.length - 1);
              threeRef.current.instancedMesh.setUniformAt('uColor', i / 3, colors[colorIndex]);
            }
          }

          resolve();
        });
      }
    });
  }, [colors]);

  const addListeners = useCallback(() => {
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('mousemove', onMousemove, { passive: true });
  }, []);

  const removeListeners = useCallback(() => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', onMousemove);
  }, []);

  const onMousemove = useCallback(
    (e: MouseEvent) => {
      if (
        !containerRef.current ||
        !threeRef.current.camera ||
        !threeRef.current.raycaster ||
        !threeRef.current.brain
      )
        return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / width) * 2 - 1;
      const y = -((e.clientY - rect.top) / height) * 2 + 1;

      mouseRef.current.set(x, y);

      gsap.to(threeRef.current.camera.position, {
        x: x * 0.2,
        y: -y * 0.2,
        duration: 0.5,
      });

      threeRef.current.raycaster.setFromCamera(mouseRef.current, threeRef.current.camera);

      intersectsRef.current = threeRef.current.raycaster.intersectObject(threeRef.current.brain);

      if (intersectsRef.current.length === 0) {
        // Mouseleave
        if (hoverRef.current) {
          hoverRef.current = false;
          animateHoverUniform(0);
        }
      } else {
        // Mouseenter
        if (!hoverRef.current) {
          hoverRef.current = true;
          animateHoverUniform(1);
        }

        gsap.to(pointRef.current, {
          x: intersectsRef.current[0]?.point.x || 0,
          y: intersectsRef.current[0]?.point.y || 0,
          z: intersectsRef.current[0]?.point.z || 0,
          overwrite: true,
          duration: 0.3,
          onUpdate: () => {
            if (threeRef.current.instancedMesh) {
              for (let i = 0; i < threeRef.current.instancedMesh.count; i++) {
                threeRef.current.instancedMesh.setUniformAt('uPointer', i, pointRef.current);
              }
            }
          },
        });
      }
    },
    [width, height],
  );

  const animateHoverUniform = useCallback((value: number) => {
    gsap.to(uniformsRef.current, {
      uHover: value,
      duration: 0.25,
      onUpdate: () => {
        if (threeRef.current.instancedMesh) {
          for (let i = 0; i < threeRef.current.instancedMesh.count; i++) {
            threeRef.current.instancedMesh.setUniformAt('uHover', i, uniformsRef.current.uHover);
          }
        }
      },
    });
  }, []);

  const checkMobile = useCallback(() => {
    isMobileRef.current = window.innerWidth < 767;
  }, []);

  const onResize = useCallback(() => {
    if (threeRef.current.camera && threeRef.current.renderer) {
      threeRef.current.camera.aspect = width / height;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(width, height);
      checkMobile();
    }
  }, [width, height]);

  useEffect(() => {
    initThreeApp();

    return () => {
      if (threeRef.current.renderer) return;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      removeListeners();
      isInitializedRef.current = false;
    };
  }, [initThreeApp, removeListeners]);

  return <div ref={containerRef} />;
});

export default BrainAnimation;
