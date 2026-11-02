varying vec3 vTerrainTarget;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vTerrainTarget = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
