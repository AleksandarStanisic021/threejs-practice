import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import "./style.css";
import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";
import terrainVertexShader from "./shaders/terrain-vertex.glsl?raw";
import terrainFragmentShader from "./shaders/terrain-fragment.glsl?raw";

const container = document.querySelector("#scene");

if (!(container instanceof HTMLElement)) {
  throw new Error("Element za Three.js scenu nije pronađen.");
}

const scene = new THREE.Scene();
scene.background = new THREE.Color("#040423");

const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  100,
);
camera.position.set(2.8, 2.4, 4.2);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const cloudMaterials = [];

function getTerrainHeight(x, z) {
  return (
    -1.35 +
    Math.sin(x * 0.28 + z * 0.12) * 0.28 +
    Math.cos(z * 0.24 - x * 0.15) * 0.22 +
    Math.sin((x + z) * 0.55) * 0.08
  );
}

const terrainMaterial = new THREE.ShaderMaterial({
  vertexShader: terrainVertexShader,
  fragmentShader: terrainFragmentShader,
  extensions: { fragDepth: true },
  uniforms: {
    uDayAmount: { value: 0 },
  },
});
const terrain = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  terrainMaterial,
);
terrain.rotation.x = -Math.PI / 2;
terrain.position.y = -5;
scene.add(terrain);

function createTree(x, z, scale) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.16, 1.1, 6),
    new THREE.MeshBasicMaterial({ color: "#70442f" }),
  );
  trunk.position.y = 0.55;
  tree.add(trunk);

  const foliageMaterial = new THREE.MeshBasicMaterial({ color: "#176b54" });
  [
    { radius: 0.85, height: 1.25, y: 1.05 },
    { radius: 0.68, height: 1.1, y: 1.65 },
    { radius: 0.48, height: 0.95, y: 2.2 },
  ].forEach(({ radius, height, y }) => {
    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry(radius, height, 7),
      foliageMaterial,
    );
    foliage.position.y = y;
    tree.add(foliage);
  });

  tree.position.set(x, getTerrainHeight(x, z), z);
  tree.scale.setScalar(scale);
  scene.add(tree);
}

[
  [-5.2, -5.5, 1.15],
  [-3.9, -4.6, 0.9],
  [-2.8, -6.8, 1.25],
  [-1.8, -5.1, 0.75],
  [2.1, -5.8, 0.9],
  [3.2, -7, 1.2],
  [4.3, -4.7, 0.85],
  [5.4, -6.2, 1.1],
].forEach(([x, z, scale]) => createTree(x, z, scale));

function createCloud(x, y, z, scale) {
  const cloud = new THREE.Group();
  const puffMaterial = new THREE.MeshBasicMaterial({
    color: "#dcecff",
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  cloudMaterials.push(puffMaterial);

  [
    { x: 0, y: 0, z: 0, scale: [1.5, 0.48, 0.65] },
    { x: -0.85, y: -0.05, z: 0, scale: [0.8, 0.55, 0.58] },
    { x: 0.78, y: 0.08, z: 0, scale: [0.9, 0.62, 0.62] },
    { x: -0.28, y: 0.35, z: 0, scale: [0.78, 0.62, 0.62] },
    { x: 0.48, y: 0.32, z: 0, scale: [0.72, 0.55, 0.58] },
  ].forEach(({ x: offsetX, y: offsetY, z: offsetZ, scale: puffScale }) => {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(1, 12, 8),
      puffMaterial,
    );
    puff.position.set(offsetX, offsetY, offsetZ);
    puff.scale.set(...puffScale);
    cloud.add(puff);
  });

  cloud.position.set(x, y, z);
  cloud.scale.setScalar(scale);
  scene.add(cloud);
  return cloud;
}

const clouds = [
  createCloud(-5.5, 4.7, -7, 1.1),
  createCloud(1.7, 5.4, -8, 0.85),
  createCloud(7, 4.3, -6.5, 1.25),
];

const sunMaterial = new THREE.MeshBasicMaterial({
  color: "#fff2a6",
  transparent: true,
  depthWrite: false,
});
const moonMaterial = new THREE.MeshBasicMaterial({
  color: "#e5edff",
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const sun = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), sunMaterial);
const moonRadius = 0.42;
const moonOffset = 0.34;
const moonIntersectionX = moonOffset / 2;
const moonIntersectionY = Math.sqrt(moonRadius ** 2 - moonIntersectionX ** 2);
const moonAngle = Math.atan2(moonIntersectionY, moonIntersectionX);
const moonShape = new THREE.Shape();
moonShape.moveTo(moonIntersectionX, moonIntersectionY);
moonShape.absarc(0, 0, moonRadius, moonAngle, Math.PI * 2 - moonAngle, false);
moonShape.quadraticCurveTo(
  moonOffset - moonRadius,
  0,
  moonIntersectionX,
  moonIntersectionY,
);
const moon = new THREE.Mesh(new THREE.ShapeGeometry(moonShape), moonMaterial);

const glowCanvas = document.createElement("canvas");
glowCanvas.width = 128;
glowCanvas.height = 128;
const glowContext = glowCanvas.getContext("2d");
if (!glowContext) {
  throw new Error("Nije moguće napraviti teksturu sjaja sunca.");
}
const glowGradient = glowContext.createRadialGradient(64, 64, 5, 64, 64, 64);
glowGradient.addColorStop(0, "rgba(255, 246, 190, 1)");
glowGradient.addColorStop(0.22, "rgba(255, 204, 92, 0.65)");
glowGradient.addColorStop(1, "rgba(255, 166, 48, 0)");
glowContext.fillStyle = glowGradient;
glowContext.fillRect(0, 0, 128, 128);

const glowTexture = new THREE.CanvasTexture(glowCanvas);
const sunGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: glowTexture,
    color: "#ffcf70",
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }),
);
sunGlow.scale.set(3.2, 3.2, 1);
sun.position.z = -10;
moon.position.z = -10;
sunGlow.position.z = -10.1;
scene.add(sunGlow, sun, moon);
const nightSkyColor = new THREE.Color("#040423");
const daySkyColor = new THREE.Color("#78b9e8");
const nightCloudColor = new THREE.Color("#7785b5");
const dayCloudColor = new THREE.Color("#dcecff");

const snowCount = 900;
const snowPositions = new Float32Array(snowCount * 3);
for (let i = 0; i < snowCount; i += 1) {
  snowPositions[i * 3] = (Math.random() - 0.5) * 16;
  snowPositions[i * 3 + 1] = Math.random() * 9;
  snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 14;
}

const snowGeometry = new THREE.BufferGeometry();
snowGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(snowPositions, 3),
);
const snow = new THREE.Points(
  snowGeometry,
  new THREE.PointsMaterial({
    color: "#eaf6ff",
    size: 0.045,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    sizeAttenuation: true,
  }),
);
scene.add(snow);

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  uniforms: {
    uTime: { value: 0 },
  },
});

const cube = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 1.7), material);
scene.add(cube);
const clock = new THREE.Clock();

function resize() {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

window.addEventListener("resize", resize);

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  material.uniforms.uTime.value = elapsed;

  const cycleDuration = 32;
  const phase = (elapsed % cycleDuration) / cycleDuration;
  const nightProgress = ((phase + 0.5) % 1) * 2;
  const sunIsUp = phase < 0.5;
  const activeProgress = sunIsUp ? phase * 2 : nightProgress;
  const altitude = Math.sin(activeProgress * Math.PI);
  const bodyOpacity = THREE.MathUtils.smoothstep(altitude, 0, 0.22);
  const dayAmount = Math.max(0, Math.sin(phase * Math.PI * 2));
  terrainMaterial.uniforms.uDayAmount.value = dayAmount;

  scene.background.copy(nightSkyColor).lerp(daySkyColor, dayAmount);
  cloudMaterials.forEach((cloudMaterial) => {
    cloudMaterial.color.copy(nightCloudColor).lerp(dayCloudColor, dayAmount);
    cloudMaterial.opacity = 0.48 + dayAmount * 0.24;
  });

  const celestialX = -8 + activeProgress * 16;
  const celestialY = 0.4 + altitude * 5.5;
  const celestialBody = sunIsUp ? sun : moon;
  const hiddenBody = sunIsUp ? moon : sun;
  celestialBody.position.set(celestialX, celestialY, -10);
  celestialBody.material.opacity = bodyOpacity;
  hiddenBody.material.opacity = 0;
  sunGlow.position.set(celestialX, celestialY, -10.1);
  sunGlow.material.opacity = sunIsUp ? bodyOpacity * 0.9 : 0;

  for (const cloud of clouds) {
    cloud.position.x += delta * 0.28;
    if (cloud.position.x > 11) cloud.position.x = -11;
  }

  for (let i = 0; i < snowCount; i += 1) {
    const index = i * 3;
    snowPositions[index + 1] -= delta * (0.8 + (i % 5) * 0.12);
    snowPositions[index] += Math.sin(elapsed + i) * delta * 0.16;
    if (snowPositions[index + 1] < -0.5) {
      snowPositions[index + 1] = 8.5;
      snowPositions[index] = (Math.random() - 0.5) * 16;
      snowPositions[index + 2] = (Math.random() - 0.5) * 14;
    }
  }
  snowGeometry.attributes.position.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
