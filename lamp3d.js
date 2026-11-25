import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

/**
 * Creates an interactive 3D WebGL scene of a desk lamp and simulated sunlight.
 * @param {HTMLElement} container
 * @returns {{ update: (ambientLight: number, lightOn: boolean) => void }}
 */
export function createLampScene(container) {
  const scene = new THREE.Scene();
  const nightBg = new THREE.Color('#000000');
  const dayBg = new THREE.Color('#cbe7fb');
  scene.background = nightBg.clone();

  const width = container.clientWidth || 300;
  const height = container.clientHeight || 300;
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);

  // Spherical orbit coordinates around the desk/lamp center
  const target = new THREE.Vector3(0, 0.9, 0);
  let theta = 0.55;
  let phi = 1.15;
  const radius = 4.6;

  function updateCameraPosition() {
    camera.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(target);
  }
  updateCameraPosition();

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  container.replaceChildren(renderer.domElement);

  // Seamless surface & horizon fog (no floating box edges)
  scene.fog = new THREE.Fog(nightBg.clone(), 6, 18);

  const surfaceMat = new THREE.MeshStandardMaterial({
    color: '#64748b',
    roughness: 0.82,
    metalness: 0.06,
  });
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), surfaceMat);
  surface.rotation.x = -Math.PI / 2;
  surface.receiveShadow = true;
  scene.add(surface);

  // Open book under the lamp
  const bookGroup = new THREE.Group();
  const coverMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.7,
    metalness: 0.05,
  });
  const pageMat = new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    roughness: 0.9,
    metalness: 0,
  });
  const inkMat = new THREE.MeshStandardMaterial({
    color: '#94a3b8',
    roughness: 0.9,
  });

  const coverBase = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.02, 0.68), coverMat);
  coverBase.position.y = 0.01;
  coverBase.castShadow = true;
  coverBase.receiveShadow = true;
  bookGroup.add(coverBase);

  for (const side of [-1, 1]) {
    const pageBlock = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.62), pageMat);
    pageBlock.position.set(side * 0.22, 0.04, 0);
    pageBlock.rotation.z = side * -0.05;
    pageBlock.castShadow = true;
    pageBlock.receiveShadow = true;
    bookGroup.add(pageBlock);

    for (let i = 0; i < 5; i++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.004, 0.018), inkMat);
      line.position.set(side * 0.22, 0.062, -0.18 + i * 0.09);
      line.rotation.z = side * -0.05;
      bookGroup.add(line);
    }
  }

  bookGroup.position.set(0.76, 0, 0.14);
  bookGroup.rotation.y = -0.22;
  scene.add(bookGroup);

  // Desk lamp geometry
  const lampGroup = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({
    color: '#27272a',
    roughness: 0.35,
    metalness: 0.65,
  });
  const jointMat = new THREE.MeshStandardMaterial({
    color: '#52525b',
    roughness: 0.3,
    metalness: 0.75,
  });

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.48, 0.09, 32),
    metalMat
  );
  base.position.set(-0.35, 0.045, 0);
  base.castShadow = true;
  base.receiveShadow = true;
  lampGroup.add(base);

  const lowerArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 1.05, 16),
    metalMat
  );
  lowerArm.position.set(-0.5, 0.52, 0);
  lowerArm.rotation.z = 0.28;
  lowerArm.castShadow = true;
  lampGroup.add(lowerArm);

  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), jointMat);
  joint.position.set(-0.65, 1.0, 0);
  joint.castShadow = true;
  lampGroup.add(joint);

  const upperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 1.0, 16),
    metalMat
  );
  upperArm.position.set(-0.26, 1.32, 0);
  upperArm.rotation.z = -0.88;
  upperArm.castShadow = true;
  lampGroup.add(upperArm);

  // Lamp head assembly
  const headGroup = new THREE.Group();
  headGroup.position.set(0.28, 1.56, 0);
  const bookCenter = new THREE.Vector3(
    bookGroup.position.x,
    0.04,
    bookGroup.position.z
  );
  const aimDir = bookCenter.clone().sub(headGroup.position).normalize();
  headGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), aimDir);

  const shadeMat = new THREE.MeshStandardMaterial({
    color: '#18181b',
    roughness: 0.4,
    metalness: 0.5,
    side: THREE.DoubleSide,
  });
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.42, 0.44, 32, 1, true),
    shadeMat
  );
  shade.castShadow = true;
  headGroup.add(shade);

  const shadeCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.18, 0.08, 24),
    metalMat
  );
  shadeCap.position.y = 0.25;
  shadeCap.castShadow = true;
  headGroup.add(shadeCap);

  const bulbMat = new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    emissive: new THREE.Color('#ffdf8a'),
    emissiveIntensity: 0,
    roughness: 0.2,
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 20), bulbMat);
  bulb.position.y = -0.1;
  headGroup.add(bulb);

  // Volumetric light cone inside/below shade
  const coneMat = new THREE.MeshBasicMaterial({
    color: '#fde68a',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const lightCone = new THREE.Mesh(
    new THREE.ConeGeometry(1.15, 1.85, 32, 1, true),
    coneMat
  );
  lightCone.position.y = -0.95;
  headGroup.add(lightCone);

  // Real 3D SpotLight from the bulb
  const lampSpot = new THREE.SpotLight('#ffd88a', 0, 8, Math.PI / 4.2, 0.65, 1.3);
  lampSpot.position.set(0, -0.1, 0);
  lampSpot.castShadow = true;
  lampSpot.shadow.mapSize.set(1024, 1024);
  lampSpot.shadow.bias = -0.001;

  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, -2, 0);
  headGroup.add(spotTarget);
  lampSpot.target = spotTarget;
  headGroup.add(lampSpot);

  lampGroup.add(headGroup);
  scene.add(lampGroup);

  // Simulated Sun Light (Directional + Hemisphere)
  const sunLight = new THREE.DirectionalLight('#fff5d6', 0);
  sunLight.position.set(-4, 5.5, 3);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 16;
  sunLight.shadow.camera.left = -3.5;
  sunLight.shadow.camera.right = 3.5;
  sunLight.shadow.camera.top = 3.5;
  sunLight.shadow.camera.bottom = -3.5;
  sunLight.shadow.bias = -0.001;
  scene.add(sunLight);

  const hemiLight = new THREE.HemisphereLight('#bae6fd', '#1e293b', 0.15);
  scene.add(hemiLight);

  // Subtle pointer-drag orbit
  let isDragging = false;
  let prevX = 0;
  let prevY = 0;

  renderer.domElement.addEventListener('pointerdown', (e) => {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
    renderer.domElement.setPointerCapture(e.pointerId);
  });

  renderer.domElement.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;

    theta -= dx * 0.008;
    phi = Math.max(0.45, Math.min(1.45, phi - dy * 0.008));
    updateCameraPosition();
    render();
  });

  renderer.domElement.addEventListener('pointerup', () => {
    isDragging = false;
  });

  function render() {
    renderer.render(scene, camera);
  }

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        render();
      }
    }
  });
  resizeObserver.observe(container);

  function update(ambientLight, lightOn) {
    const sunRatio = Math.max(0, Math.min(1, ambientLight / 100));

    scene.background.copy(nightBg).lerp(dayBg, sunRatio);
    scene.fog.color.copy(scene.background);
    sunLight.intensity = sunRatio * 3.8;
    hemiLight.intensity = sunRatio * 2.0;

    lampSpot.intensity = lightOn ? 11 : 0;
    bulbMat.emissiveIntensity = lightOn ? 3.2 : 0;
    bulbMat.color.set(lightOn ? '#fffbeb' : '#cbd5e1');
    coneMat.opacity = lightOn ? 0.12 : 0;

    render();
  }

  return { update };
}
