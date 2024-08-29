import React, { useEffect, useRef, useCallback, useMemo } from "react";
import { Scene, WebGLRenderer, PerspectiveCamera, BoxGeometry, ShaderMaterial, Color, Vector2, Vector3, Raycaster, Object3D, MathUtils, LoadingManager, BufferGeometry, } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Stats from "stats.js";
import gsap from "gsap";
import vertexShader from "../../shaders/brain.vertex.glsl";
import fragmentShader from "../../shaders/brain.fragment.glsl";
import { InstancedUniformsMesh } from "three-instanced-uniforms-mesh";
var BrainAnimation = function (_a) {
    var width = _a.width, height = _a.height;
    var containerRef = useRef(null);
    var statsRef = useRef(null);
    var animationFrameRef = useRef(null);
    var isInitializedRef = useRef(false);
    var threeRef = useRef({
        scene: null,
        camera: null,
        renderer: null,
        raycaster: null,
        brain: null,
        instancedMesh: null,
    });
    var colors = useMemo(function () { return [
        new Color(0x963cbd),
        new Color(0xff6f61),
        new Color(0xc5299b),
        new Color(0xfeae51),
    ]; }, []);
    var uniformsRef = useRef({
        uHover: 0,
    });
    var isMobileRef = useRef(false);
    var mouseRef = useRef(new Vector2());
    var intersectsRef = useRef([]);
    var hoverRef = useRef(false);
    var pointRef = useRef(new Vector3());
    var loadingManagerRef = useRef(null);
    var gltfLoaderRef = useRef(null);
    var initThreeApp = useCallback(function () {
        if (isInitializedRef.current || threeRef.current.renderer)
            return;
        isInitializedRef.current = true;
        statsRef.current = new Stats();
        // document.body.appendChild(statsRef.current.dom);
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
        loadingManagerRef.current.onLoad = function () {
            document.documentElement.classList.add("model-loaded");
        };
        gltfLoaderRef.current = new GLTFLoader(loadingManagerRef.current);
        checkMobile();
        loadModel().then(function () {
            addListeners();
            animate();
        });
    }, [width, height]);
    var animate = useCallback(function () {
        if (!isInitializedRef.current)
            return;
        if (statsRef.current)
            statsRef.current.begin();
        update();
        render();
        if (statsRef.current)
            statsRef.current.end();
        animationFrameRef.current = requestAnimationFrame(animate);
    }, []);
    var update = useCallback(function () {
        if (threeRef.current.camera) {
            threeRef.current.camera.lookAt(0, 0, 0);
            threeRef.current.camera.position.z = isMobileRef.current ? 2.3 : 1.2;
        }
    }, []);
    var render = useCallback(function () {
        if (threeRef.current.renderer &&
            threeRef.current.scene &&
            threeRef.current.camera) {
            threeRef.current.renderer.render(threeRef.current.scene, threeRef.current.camera);
        }
    }, []);
    var loadModel = useCallback(function () {
        return new Promise(function (resolve) {
            if (gltfLoaderRef.current && threeRef.current.scene) {
                gltfLoaderRef.current.load("./static/brain.glb", function (gltf) {
                    var brainMesh = gltf.scene.children[0];
                    threeRef.current.brain = brainMesh;
                    var geometry = new BoxGeometry(0.004, 0.004, 0.004, 1, 1, 1);
                    var material = new ShaderMaterial({
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
                        threeRef.current.instancedMesh = new InstancedUniformsMesh(geometry, material, brainMesh.geometry.attributes.position.count);
                        threeRef.current.scene.add(threeRef.current.instancedMesh);
                        var dummy = new Object3D();
                        var positions = brainMesh.geometry.attributes.position.array;
                        for (var i = 0; i < positions.length; i += 3) {
                            dummy.position.set(positions[i + 0], positions[i + 1], positions[i + 2]);
                            dummy.updateMatrix();
                            threeRef.current.instancedMesh.setMatrixAt(i / 3, dummy.matrix);
                            threeRef.current.instancedMesh.setUniformAt("uRotation", i / 3, MathUtils.randFloat(-1, 1));
                            threeRef.current.instancedMesh.setUniformAt("uSize", i / 3, MathUtils.randFloat(0.3, 3));
                            var colorIndex = MathUtils.randInt(0, colors.length - 1);
                            threeRef.current.instancedMesh.setUniformAt("uColor", i / 3, colors[colorIndex]);
                        }
                    }
                    resolve();
                });
            }
        });
    }, [colors]);
    var addListeners = useCallback(function () {
        window.addEventListener("resize", onResize, { passive: true });
        window.addEventListener("mousemove", onMousemove, { passive: true });
    }, []);
    var removeListeners = useCallback(function () {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("mousemove", onMousemove);
    }, []);
    var onMousemove = useCallback(function (e) {
        var _a, _b, _c;
        if (!containerRef.current ||
            !threeRef.current.camera ||
            !threeRef.current.raycaster ||
            !threeRef.current.brain)
            return;
        var rect = containerRef.current.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / width) * 2 - 1;
        var y = -((e.clientY - rect.top) / height) * 2 + 1;
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
        }
        else {
            // Mouseenter
            if (!hoverRef.current) {
                hoverRef.current = true;
                animateHoverUniform(1);
            }
            gsap.to(pointRef.current, {
                x: ((_a = intersectsRef.current[0]) === null || _a === void 0 ? void 0 : _a.point.x) || 0,
                y: ((_b = intersectsRef.current[0]) === null || _b === void 0 ? void 0 : _b.point.y) || 0,
                z: ((_c = intersectsRef.current[0]) === null || _c === void 0 ? void 0 : _c.point.z) || 0,
                overwrite: true,
                duration: 0.3,
                onUpdate: function () {
                    if (threeRef.current.instancedMesh) {
                        for (var i = 0; i < threeRef.current.instancedMesh.count; i++) {
                            threeRef.current.instancedMesh.setUniformAt("uPointer", i, pointRef.current);
                        }
                    }
                },
            });
        }
    }, [width, height]);
    var animateHoverUniform = useCallback(function (value) {
        gsap.to(uniformsRef.current, {
            uHover: value,
            duration: 0.25,
            onUpdate: function () {
                if (threeRef.current.instancedMesh) {
                    for (var i = 0; i < threeRef.current.instancedMesh.count; i++) {
                        threeRef.current.instancedMesh.setUniformAt("uHover", i, uniformsRef.current.uHover);
                    }
                }
            },
        });
    }, []);
    var checkMobile = useCallback(function () {
        isMobileRef.current = window.innerWidth < 767;
    }, []);
    var onResize = useCallback(function () {
        if (threeRef.current.camera && threeRef.current.renderer) {
            threeRef.current.camera.aspect = width / height;
            threeRef.current.camera.updateProjectionMatrix();
            threeRef.current.renderer.setSize(width, height);
            checkMobile();
        }
    }, [width, height]);
    useEffect(function () {
        initThreeApp();
        return function () {
            if (threeRef.current.renderer) {
                threeRef.current.renderer.dispose();
                threeRef.current.renderer = null;
            }
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            removeListeners();
            isInitializedRef.current = false;
        };
    }, [initThreeApp, removeListeners]);
    return React.createElement("div", { ref: containerRef, style: { overflow: "hidden" } });
};
export default BrainAnimation;
