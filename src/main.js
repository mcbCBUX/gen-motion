import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
document.body.appendChild(renderer.domElement);

// Environment
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
pmremGenerator.dispose();

const loader = new THREE.TextureLoader();

const textures = {
  '/tex1.png': loader.load('/tex1.png'),
  '/tex2.png': loader.load('/tex2.png'),
  '/tex3.png': loader.load('/tex3.png'),
};

const backgrounds = {
  '/bg1.gif': loader.load('/bg1.gif'),
  '/bg2.gif': loader.load('/bg2.gif'),
  '/bg3.gif': loader.load('/bg3.gif'),
};

// Geometries
const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const innerGeo = new THREE.BoxGeometry(1.45, 1.45, 1.45);

// Materials & meshes (create them first)
const innerMat = new THREE.MeshBasicMaterial({
  map: loader.load('/tex2.png'),
  side: THREE.BackSide
});
const innerCube = new THREE.Mesh(innerGeo, innerMat);
scene.add(innerCube);

const material = new THREE.MeshPhysicalMaterial({
  map: loader.load('/tex2.png'),
  metalness: 0.0,
  roughness: 0.05,
  transmission: 0.85,
  thickness: 0.2,
  transparent: true,
  envMapIntensity: 1.8
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// NOW store original positions (after meshes exist)
const outerPos = cube.geometry.attributes.position;
const innerPos = innerCube.geometry.attributes.position;
const outerOriginal = outerPos.array.slice();
const innerOriginal = innerPos.array.slice();

// Initial background
scene.background = backgrounds['/bg3.gif'];

// Button handlers
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const file = btn.dataset.file;

    if (type === 'tex') {
      material.map = textures[file];
      material.needsUpdate = true;
      innerMat.map = textures[file];
      innerMat.needsUpdate = true;
    }
    if (type === 'bg') {
      scene.background = backgrounds[file];
    }

    document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Ripple button
let ripple = 0;
let rippleActive = false;

document.getElementById('rippleBtn').addEventListener('click', () => {
  rippleActive = !rippleActive;
  if (!rippleActive) {
    outerPos.array.set(outerOriginal);
    innerPos.array.set(innerOriginal);
    outerPos.needsUpdate = true;
    innerPos.needsUpdate = true;
  }
});

scene.add(new THREE.AmbientLight(0xffffff, 1));
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(2, 3, 4);
scene.add(light);

camera.position.z = 3;

// Single animate function
function animate() {
  if (rippleActive) {
    ripple += 0.15;
    for (let i = 0; i < outerPos.count; i++) {
      const ix = i * 3;
      const x = outerOriginal[ix];
      const y = outerOriginal[ix + 1];
      const z = outerOriginal[ix + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      const offset = Math.sin(dist * 8 - ripple) * 0.04;
      outerPos.array[ix]     = x + x * offset;
      outerPos.array[ix + 1] = y + y * offset;
      outerPos.array[ix + 2] = z + z * offset;
    }
    outerPos.needsUpdate = true;

    for (let i = 0; i < innerPos.count; i++) {
      const ix = i * 3;
      const x = innerOriginal[ix];
      const y = innerOriginal[ix + 1];
      const z = innerOriginal[ix + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      const offset = Math.sin(dist * 8 - ripple) * 0.04;
      innerPos.array[ix]     = x + x * offset;
      innerPos.array[ix + 1] = y + y * offset;
      innerPos.array[ix + 2] = z + z * offset;
    }
    innerPos.needsUpdate = true;
  }

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  innerCube.rotation.x += 0.01;
  innerCube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});