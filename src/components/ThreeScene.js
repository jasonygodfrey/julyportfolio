import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';
import * as CANNON from 'cannon-es';
import { Text } from 'troika-three-text';

const ThreeScene = () => {
  const mountRef = useRef(null);
  const keyState = {};
  const mouseMovement = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 8.5);
    directionalLight.position.set(0, -350, -30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096; // Increase shadow map size for better quality
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Add an additional spotlight to enhance illumination
    const spotLight = new THREE.SpotLight(0xffffff, 2);
    spotLight.position.set(0, 30, 20);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.5;
    spotLight.decay = 2;
    spotLight.distance = 100;
    spotLight.castShadow = true;
    //scene.add(spotLight);

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

    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);

    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    const gridHelper = new THREE.GridHelper(100, 100, 0xffffff, 0xffffff);
    scene.add(gridHelper);

    let playerMesh, playerMixer, playerAnimations;
    const playerBody = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
      position: new CANNON.Vec3(0, 5, 0),
    });
    playerBody.angularFactor.set(0, 0, 0);
    world.addBody(playerBody);

    const gltfLoader = new GLTFLoader();
    gltfLoader.load('/silver/scene.gltf', (gltf) => {
      playerMesh = gltf.scene;
      playerMesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
        }
      });
      playerMesh.rotation.y = Math.PI;
      playerMesh.scale.set(0.10, 0.10, 0.10);
     // scene.add(playerMesh);

      playerMixer = new THREE.AnimationMixer(playerMesh);
      playerAnimations = gltf.animations;

      if (playerAnimations.length > 0) {
        const defaultAction = playerMixer.clipAction(playerAnimations[0]);
        defaultAction.play();
      }
    });

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
          child.material.emissive = new THREE.Color(0xff5555);
          child.material.emissiveIntensity = 0.0;
          
          const color = new THREE.Color(child.material.color);
          const hsl = color.getHSL({});
          color.setHSL(hsl.h, 30, hsl.l);
          child.material.color = color;

          child.castShadow = true;
        }
      });
      dragon.position.set(0, 0, 10);
      dragon.rotateY(160);
      dragon.scale.set(0.3, 0.35, 0.3);
      scene.add(dragon);

      // Add spotlight to illuminate the dragon
      const spotLight = new THREE.SpotLight(0xffffff, 2);
      spotLight.position.set(0, 10, 5);
      spotLight.angle = Math.PI / 4;
      spotLight.penumbra = 0.5;
      spotLight.decay = 2;
      spotLight.distance = 50;
      spotLight.castShadow = true;
      spotLight.target = dragon;
      scene.add(spotLight);

      mixer = new THREE.AnimationMixer(dragon);
      const animations = gltf.animations;
      if (animations.length > 0) {
        const action = mixer.clipAction(animations[0]);
        action.play();
      }
    });

    let mixer2;
    const loader2 = new GLTFLoader();
    loader2.load('avatar_2025/bucky4.gltf', function (gltf) {
      gltf.scene.traverse(function (child) {
        if (child.isMesh) {
          const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, opacity: 0.118, transparent: true });
          child.material = wireframeMaterial;
        }
      });
      gltf.scene.scale.set(60, 60, 60);
      scene.add(gltf.scene);
 
      gltf.scene.position.y += 1.7;
 
      if (gltf.animations && gltf.animations.length) {
        mixer2 = new THREE.AnimationMixer(gltf.scene);
        gltf.animations.forEach((clip) => {
          const action = mixer2.clipAction(clip);
          const slowerDuration = clip.duration * 75;
          action.setDuration(slowerDuration);
          action.loop = THREE.LoopRepeat;
          action.clampWhenFinished = true;
          action.play();
        });
      }
    }, undefined, function (error) {
      console.error(error);
    });

// Load the mortal_kombat_fractured_logo model
gltfLoader.load('/mortal_kombat_fractured_logo/scene.gltf', (gltf) => {
  const logo = gltf.scene;
  logo.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        wireframe: true,
        transparent: true,
        opacity: 0.1 // Reduce the opacity
      });
      child.castShadow = true;
    }
  });
  logo.position.set(0, 0, -1); // Adjust the position as needed
  logo.scale.set(1.6, 0.05, 0.4); // Adjust the scale as needed
  logo.rotation.x = Math.PI / 2; // Rotate 90 degrees upright

  scene.add(logo);
});
// Load the mortal_kombat_fractured_logo model
gltfLoader.load('/mortal_kombat_fractured_logo/scene.gltf', (gltf) => {
  const logo2 = gltf.scene;
  logo2.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        wireframe: true,
        transparent: true,
        opacity: 0.1 // Reduce the opacity
      });
      child.castShadow = true;
    }
  });
  logo2.position.set(0, 3.8, -1); // Adjust the position as needed
  logo2.scale.set(1.6, 0.05, 0.4); // Adjust the scale as needed
  logo2.rotation.x = Math.PI / 2; // Rotate 90 degrees upright

  scene.add(logo2);
});




    gltfLoader.load('/pulses/scene.gltf', (gltf) => {
      const pulses = gltf.scene;
      pulses.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
        }
      });
      pulses.position.set(0, 0, 0);
      pulses.scale.set(20, 20, 20);

      const pulsesMixer = new THREE.AnimationMixer(pulses);
      const pulsesAnimations = gltf.animations;
      if (pulsesAnimations.length > 0) {
        const action = pulsesMixer.clipAction(pulsesAnimations[0]);
        action.play();
      }
    });

    const textMesh = new Text();
    textMesh.text = '開発者';
    textMesh.fontSize = 23;
    textMesh.position.set(35, 24, 18);
    textMesh.rotation.x = Math.PI / -180;
    textMesh.rotation.y = Math.PI / -1;

    textMesh.material = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, 
      wireframe: false,
      transparent: false,
      opacity: 1
    });

    textMesh.sync(() => {
      scene.add(textMesh);
    });

    const textMesh2 = new Text();
    textMesh2.text = '開発者';
    textMesh2.fontSize = 10;
    textMesh2.position.set(15, 22, 15);
    textMesh2.rotation.x = Math.PI / -180;
    textMesh2.rotation.y = Math.PI / -1;
    textMesh2.material = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, 
      wireframe: true,
      transparent: true,
      opacity: 1
    });

    textMesh2.sync(() => {
      // scene.add(textMesh2);
    });

    const circleGeometry = new THREE.CircleGeometry(5, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const circleMesh = new THREE.Mesh(circleGeometry, circleMaterial);
    circleMesh.position.set(0, 2, 0);

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.65,
      0.01,
      0.075
    );

    // Add SMAA pass
    const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composer.addPass(smaaPass);

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

      if (keyState['KeyW']) {
        playerBody.velocity.z = moveSpeed;
        isMoving = true;
      } else if (keyState['KeyS']) {
        playerBody.velocity.z = -moveSpeed;
        isMoving = true;
      } else {
        playerBody.velocity.z = 0;
      }

      if (keyState['KeyA']) {
        playerBody.velocity.x = moveSpeed;
        isMoving = true;
      } else if (keyState['KeyD']) {
        playerBody.velocity.x = -moveSpeed;
        isMoving = true;
      } else {
        playerBody.velocity.x = 0;
      }

      if (keyState['Space'] && Math.abs(playerBody.velocity.y) < 0.1) {
        playerBody.velocity.y = jumpForce;
      }

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
    let angle = (82 * Math.PI) / 180;
    let direction = 1;
    const radius = -5;
    const initialCameraZ = 2;
    const minAngle = (80 * Math.PI) / 180;
    const maxAngle = (100 * Math.PI) / 180;

    camera.position.set(0, 10, initialCameraZ);

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      updatePlayerMovement();
      world.step(1 / 60);

      if (playerMesh) {
        playerMesh.position.copy(playerBody.position);
        playerMesh.quaternion.copy(playerBody.quaternion);
      }

      if (playerMixer) playerMixer.update(1 / 60);

      if (mixer) mixer.update(1 / 60);
      if (mixer2) mixer2.update(1 / 60);

      angle += delta * 0.05 * direction;

      if (angle >= maxAngle || angle <= minAngle) {
        direction *= -1;
      }

      camera.position.x = radius * Math.cos(angle) + mouseMovement.current.x * 2;
      camera.position.z = initialCameraZ + radius * Math.sin(angle) + mouseMovement.current.y * 5;
      camera.position.y = 1 + mouseMovement.current.y * 2;
      camera.lookAt(circleMesh.position);

      composer.render();
    };

    const circleTexture = new THREE.TextureLoader().load("circle.png");
    const circleMaterial2 = new THREE.MeshBasicMaterial({
      map: circleTexture,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const circleGeometry2 = new THREE.CircleGeometry(7.5, 32); // 7.5 is the radius and 32 is the number of segments
    const circleMesh2 = new THREE.Mesh(circleGeometry2, circleMaterial2);
    circleMesh2.position.set(0, 0.1, 0); // Adjust the position as necessary
    circleMesh2.rotation.set(1.5, 0, 0);
    scene.add(circleMesh2);

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
