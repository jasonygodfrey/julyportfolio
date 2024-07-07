import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import * as CANNON from 'cannon-es';

const ThreeScene = () => {
  const mountRef = useRef(null);
  const keyState = {};
  const mouseMovement = useRef({ x: 0, y: 0 }); // Initialize mouseMovement

  useEffect(() => {
    // Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Skybox
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      'path/to/px.jpg',
      'path/to/nx.jpg',
      'path/to/py.jpg',
      'path/to/ny.jpg',
      'path/to/pz.jpg',
      'path/to/nz.jpg',
    ]);
    scene.background = texture;

    // Cannon.js setup
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);

    // Create a plane
    const groundBody = new CANNON.Body({
      mass: 0, // mass = 0 makes the body static
      shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // Create a grid helper
    const gridHelper = new THREE.GridHelper(100, 100, 0xffffff, 0xffffff);
    scene.add(gridHelper);

    // Load the player model and setup animations
    let playerMesh, playerMixer, playerAnimations;
    const playerBody = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
      position: new CANNON.Vec3(0, 5, 0),
    });
    playerBody.angularFactor.set(0, 0, 0); // Prevent rotation around X and Z axes
    world.addBody(playerBody);

    const gltfLoader = new GLTFLoader();
    gltfLoader.load('/silver/scene.gltf', (gltf) => {
      playerMesh = gltf.scene;
      playerMesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
        }
      });
      playerMesh.rotation.y = Math.PI; // Rotate the player 180 degrees
      playerMesh.scale.set(0.15, 0.15, 0.15); // Set the scale of the player model smaller
      scene.add(playerMesh);

      playerMixer = new THREE.AnimationMixer(playerMesh);
      playerAnimations = gltf.animations;

      // Assuming animation [5] is the running animation
      if (playerAnimations.length > 5) {
        const runningAction = playerMixer.clipAction(playerAnimations[5]);
        runningAction.clampWhenFinished = true;
        runningAction.loop = THREE.LoopRepeat;
      }
    });

    // Load the dragon model and textures
    const textureLoader = new THREE.TextureLoader();
    const diffuseTexture = textureLoader.load('/dragon/textures/MI_M_B_44_Qishilong_body02_2_Inst_diffuse.png');
    const normalTexture = textureLoader.load('/dragon/textures/MI_M_B_44_Qishilong_body02_2_Inst_normal.png');

    let mixer;
    gltfLoader.load('/dragon/scene.gltf', (gltf) => {
      const dragon = gltf.scene;
      dragon.traverse((child) => {
        if (child.isMesh) {
          child.material.map = diffuseTexture;
          child.material.normalMap = normalTexture;
          child.material.emissive = new THREE.Color(0x555555); // Emissive color
          child.material.emissiveIntensity = 0.05; // Emissive intensity

          //child.castShadow = true;
        }
      });
      dragon.position.set(0, 0, 10);
      dragon.rotateY(160);
      dragon.scale.set(0.2, 0.2, 0.2);
      scene.add(dragon);

      mixer = new THREE.AnimationMixer(dragon);
      const animations = gltf.animations;
      if (animations.length > 0) {
        const action = mixer.clipAction(animations[0]);
        action.play();
      }
    });

    // Load the pulses model
    gltfLoader.load('/pulses/scene.gltf', (gltf) => {
      const pulses = gltf.scene;
      pulses.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
        }
      });
      pulses.position.set(0, 0, 0); // Set the position of the pulses model
      pulses.scale.set(20, 20, 20); // Set the scale of the pulses model
      //scene.add(pulses);

      const pulsesMixer = new THREE.AnimationMixer(pulses);
      const pulsesAnimations = gltf.animations;
      if (pulsesAnimations.length > 0) {
        const action = pulsesMixer.clipAction(pulsesAnimations[0]);
        action.play();
      }
    });

    // Create a circle mesh for the camera to look at
    const circleGeometry = new THREE.CircleGeometry(5, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const circleMesh = new THREE.Mesh(circleGeometry, circleMaterial);
    circleMesh.position.set(0, 2, 0); // Set the circle mesh higher


    //scene.add(circleMesh);

    // Bloom effect
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.25, // strength
      0.2, // radius
      0.085 // threshold
    );

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Key event listeners
    const handleKeyDown = (event) => {
      keyState[event.code] = true;
    };

    const handleKeyUp = (event) => {
      keyState[event.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const updatePlayerMovement = () => {
      const moveSpeed = 5;
      const jumpForce = 4;
      let isMoving = false;

      // Move forward/backward
      if (keyState['KeyW']) {
        playerBody.velocity.z = moveSpeed;
        isMoving = true;
      } else if (keyState['KeyS']) {
        playerBody.velocity.z = -moveSpeed;
        isMoving = true;
      } else {
        playerBody.velocity.z = 0;
      }

      // Move left/right
      if (keyState['KeyA']) {
        playerBody.velocity.x = moveSpeed;
        isMoving = true;
      } else if (keyState['KeyD']) {
        playerBody.velocity.x = -moveSpeed;
        isMoving = true;
      } else {
        playerBody.velocity.x = 0;
      }

      // Jump
      if (keyState['Space'] && Math.abs(playerBody.velocity.y) < 0.1) {
        playerBody.velocity.y = jumpForce;
      }

      // Play running animation if moving
      if (playerMixer && playerAnimations.length > 5) {
        const runningAction = playerMixer.clipAction(playerAnimations[5]);
        if (isMoving) {
          if (!runningAction.isRunning()) {
            runningAction.play();
          }
        } else {
          runningAction.stop();
        }
      }
    };

    const clock = new THREE.Clock();
    let angle = (62 * Math.PI) / 180; // Start angle at 30 degrees
    let direction = 1; // 1 for forward, -1 for backward
    const radius = -5; // Radius for circular motion
    const initialCameraZ = 2; // Initial position closer
    const minAngle = (60 * Math.PI) / 180; // Minimum angle for 30 degrees
    const maxAngle = (120 * Math.PI) / 180; // Maximum angle for 150 degrees

    camera.position.set(0, 10, initialCameraZ); // Set initial camera position higher

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      updatePlayerMovement();
      world.step(1 / 60);

      if (playerMesh) {
        playerMesh.position.copy(playerBody.position);
        playerMesh.quaternion.copy(playerBody.quaternion);

        // Debugging position and velocity
        console.log(`Player position: ${playerMesh.position.x}, ${playerMesh.position.y}, ${playerMesh.position.z}`);
        console.log(`Player velocity: ${playerBody.velocity.x}, ${playerBody.velocity.y}, ${playerBody.velocity.z}`);
      }

      if (playerMixer) playerMixer.update(1 / 60);

      if (mixer) mixer.update(1 / 60);

      angle += delta * 0.05 * direction; // Adjust speed of rotation

      if (angle >= maxAngle || angle <= minAngle) {
        direction *= -1; // Reverse direction when reaching the ends
      }

      camera.position.x = radius * Math.cos(angle) + mouseMovement.current.x * 2; // Add mouse parallax
      camera.position.z = initialCameraZ + radius * Math.sin(angle) + mouseMovement.current.y * 5; // Adjust for closer position
      camera.position.y = 1 + mouseMovement.current.y * 2; // Adjust for vertical mouse movement
      camera.lookAt(circleMesh.position); // Ensure circleMesh is the focus

      composer.render();
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} />;
};

export default ThreeScene;
