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
const trunkMaterial = new THREE.MeshBasicMaterial({ color: "#70442f" });
const firMaterial = new THREE.MeshBasicMaterial({ color: "#176b54" });
const pineMaterial = new THREE.MeshBasicMaterial({ color: "#247a68" });
const leafMaterials = [
  new THREE.MeshBasicMaterial({ color: "#3d8b50" }),
  new THREE.MeshBasicMaterial({ color: "#7a9b45" }),
  new THREE.MeshBasicMaterial({ color: "#b7683e" }),
];

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

function createTree(x, z, scale, kind = "fir", leafColor = 0) {
  const tree = new THREE.Group();
  const trunkHeight = kind === "broadleaf" ? 1.35 : 1.1;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, trunkHeight, 6), trunkMaterial);
  trunk.position.y = trunkHeight / 2;
  tree.add(trunk);

  if (kind === "broadleaf") {
    [
      { x: 0, y: 1.75, z: 0, radius: 0.72 },
      { x: -0.42, y: 1.55, z: 0.08, radius: 0.48 },
      { x: 0.42, y: 1.55, z: -0.05, radius: 0.5 },
      { x: 0.05, y: 2.15, z: 0, radius: 0.48 },
    ].forEach(({ x, y, z: offsetZ, radius }) => {
      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 10, 8),
        leafMaterials[leafColor],
      );
      crown.position.set(x, y, offsetZ);
      tree.add(crown);
    });
  } else {
    const layers =
      kind === "pine"
        ? [
            { radius: 0.68, height: 1.35, y: 1.25 },
            { radius: 0.55, height: 1.2, y: 1.85 },
          ]
        : [
            { radius: 0.85, height: 1.25, y: 1.05 },
            { radius: 0.68, height: 1.1, y: 1.65 },
            { radius: 0.48, height: 0.95, y: 2.2 },
          ];
    layers.forEach(({ radius, height, y }) => {
      const foliage = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 7),
        kind === "pine" ? pineMaterial : firMaterial,
      );
      foliage.position.y = y;
      tree.add(foliage);
    });
  }

  tree.position.set(x, getTerrainHeight(x, z), z);
  tree.scale.setScalar(scale);
  scene.add(tree);
}

[
  [-9, -12, 1.05, "fir"],
  [-6, -13, 0.8, "broadleaf", 1],
  [-3, -12, 0.9, "pine"],
  [2, -13, 1.1, "fir"],
  [6, -12, 0.85, "broadleaf", 0],
  [9, -11, 1.15, "pine"],
  [-8, -9, 0.8, "broadleaf", 2],
  [-2, -11, 1.2, "fir"],
  [-2, -9, 0.7, "pine"],
  [3, -9, 0.9, "broadleaf", 1],
  [6, -8, 1.1, "fir"],
  [9, -7, 0.8, "broadleaf", 0],
  [-9, -5, 1.2, "pine"],
  [-9, -3, 0.85, "broadleaf", 1],
  [-1, -5, 1.05, "fir"],
  [3, -5, 0.8, "pine"],
  [6, -4, 1.2, "fir"],
  [9, -5, 0.9, "broadleaf", 2],
  [-8, -1, 0.8, "fir"],
  [-5, 1, 1.1, "broadleaf", 0],
  [5, 1, 0.9, "pine"],
  [8, 0, 1.15, "broadleaf", 1],
  [-9, 4, 1, "pine"],
  [-6, 5, 0.8, "broadleaf", 2],
  [6, 5, 1.05, "fir"],
  [9, 4, 0.85, "broadleaf", 0],
].forEach(([x, z, scale, kind, leafColor = 0]) =>
  createTree(x, z, scale, kind, leafColor),
);

function createCastle() {
  const castle = new THREE.Group();
  const stoneMaterial = new THREE.MeshBasicMaterial({ color: "#b9c9df" });
  const lightStoneMaterial = new THREE.MeshBasicMaterial({ color: "#e5edf7" });
  const roofMaterial = new THREE.MeshBasicMaterial({ color: "#344b78" });
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: "#18243d" });
  const windowMaterial = new THREE.MeshBasicMaterial({ color: "#ffd27a" });
  const bannerMaterial = new THREE.MeshBasicMaterial({
    color: "#c94357",
    side: THREE.DoubleSide,
  });

  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 2.4, 3.2),
    stoneMaterial,
  );
  wall.position.y = 1.2;
  castle.add(wall);

  const lowerTrim = new THREE.Mesh(
    new THREE.BoxGeometry(5.35, 0.18, 3.32),
    lightStoneMaterial,
  );
  lowerTrim.position.y = 0.3;
  castle.add(lowerTrim);

  const battlements = [];
  for (let x = -2.35; x <= 2.36; x += 0.58) {
    battlements.push([x, 2.6, 0, 0.32, 0.38, 0.38]);
  }
  for (let z = -1.25; z <= 1.26; z += 0.62) {
    battlements.push([-2.62, 2.6, z, 0.38, 0.38, 0.32]);
    battlements.push([2.62, 2.6, z, 0.38, 0.38, 0.32]);
  }
  battlements.forEach(([x, y, z, width, height, depth]) => {
    const merlon = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      lightStoneMaterial,
    );
    merlon.position.set(x, y, z);
    castle.add(merlon);
  });

  const towerPositions = [
    [-2.55, -1.55, 3.6],
    [2.55, -1.55, 3.6],
    [-2.55, 1.55, 3.15],
    [2.55, 1.55, 3.15],
  ];
  towerPositions.forEach(([x, z, height]) => {
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.68, height, 10),
      lightStoneMaterial,
    );
    tower.position.set(x, height / 2, z);
    castle.add(tower);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(0.82, 1.45, 10),
      roofMaterial,
    );
    roof.position.set(x, height + 0.72, z);
    castle.add(roof);

    const roofFinial = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      windowMaterial,
    );
    roofFinial.position.set(x, height + 1.48, z);
    castle.add(roofFinial);

    for (const windowY of [1.25, 2.25]) {
      const slit = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.36, 0.035),
        windowMaterial,
      );
      slit.position.set(x, windowY, z + 0.59);
      castle.add(slit);
    }
  });

  const keep = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 2.5, 1.8),
    lightStoneMaterial,
  );
  keep.position.set(0, 2.15, -0.5);
  castle.add(keep);

  const keepRoof = new THREE.Mesh(
    new THREE.ConeGeometry(1.55, 1.5, 4),
    roofMaterial,
  );
  keepRoof.position.set(0, 4.15, -0.5);
  keepRoof.rotation.y = Math.PI / 4;
  castle.add(keepRoof);

  for (const x of [-0.62, 0.62]) {
    const keepWindow = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.48, 0.04),
      windowMaterial,
    );
    keepWindow.position.set(x, 2.55, 0.42);
    castle.add(keepWindow);
  }

  const gateShape = new THREE.Shape();
  gateShape.moveTo(-0.55, 0);
  gateShape.lineTo(-0.55, 1.05);
  gateShape.quadraticCurveTo(-0.55, 1.65, 0, 1.65);
  gateShape.quadraticCurveTo(0.55, 1.65, 0.55, 1.05);
  gateShape.lineTo(0.55, 0);
  gateShape.closePath();
  const gate = new THREE.Mesh(
    new THREE.ShapeGeometry(gateShape),
    shadowMaterial,
  );
  gate.position.set(0, 0, 1.62);
  castle.add(gate);

  const drawbridge = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.16, 1.55),
    new THREE.MeshBasicMaterial({ color: "#72513d" }),
  );
  drawbridge.position.set(0, 0.12, 2.3);
  castle.add(drawbridge);

  for (const x of [-1.4, 1.4]) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 1.25, 6),
      windowMaterial,
    );
    pole.position.set(x, 3.5, 1.52);
    castle.add(pole);

    const bannerShape = new THREE.Shape();
    bannerShape.moveTo(0, 0.55);
    bannerShape.lineTo(0.48, 0.55);
    bannerShape.lineTo(0.48, -0.18);
    bannerShape.lineTo(0.24, -0.02);
    bannerShape.lineTo(0, -0.18);
    bannerShape.closePath();
    const banner = new THREE.Mesh(
      new THREE.ShapeGeometry(bannerShape),
      bannerMaterial,
    );
    banner.position.set(x + 0.04, 3.88, 1.54);
    castle.add(banner);
  }

  castle.position.set(-5, getTerrainHeight(-5, -5), -5);
  castle.scale.setScalar(0.52);
  scene.add(castle);
}

createCastle();

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
  createCloud(-8, 5.5, -10, 1.05),
  createCloud(-4.5, 4.7, -7, 0.8),
  createCloud(-1, 5.8, -11, 1.1),
  createCloud(2.5, 4.8, -8, 0.85),
  createCloud(6, 5.7, -10, 1.15),
  createCloud(9, 4.5, -7, 0.9),
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
