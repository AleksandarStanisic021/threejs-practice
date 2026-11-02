uniform float uDayAmount;

varying vec3 vTerrainTarget;

float terrainHeight(vec2 p) {
  return -1.35
    + sin(p.x * 0.28 + p.y * 0.12) * 0.28
    + cos(p.y * 0.24 - p.x * 0.15) * 0.22
    + sin((p.x + p.y) * 0.55) * 0.08;
}

vec3 terrainNormal(vec3 p) {
  const float epsilon = 0.035;
  float left = terrainHeight(p.xz - vec2(epsilon, 0.0));
  float right = terrainHeight(p.xz + vec2(epsilon, 0.0));
  float back = terrainHeight(p.xz - vec2(0.0, epsilon));
  float front = terrainHeight(p.xz + vec2(0.0, epsilon));
  return normalize(vec3(left - right, 2.0 * epsilon, back - front));
}

void main() {
  vec3 rayOrigin = cameraPosition;
  vec3 rayDirection = normalize(vTerrainTarget - rayOrigin);
  float maxDistance = distance(rayOrigin, vTerrainTarget);
  float distanceAlongRay = 0.0;
  float previousDistance = 0.0;
  float hitDistance = 0.0;
  bool hit = false;

  for (int i = 0; i < 96; i++) {
    vec3 point = rayOrigin + rayDirection * distanceAlongRay;
    float surfaceDistance = point.y - terrainHeight(point.xz);

    if (surfaceDistance < 0.02) {
      float low = previousDistance;
      float high = distanceAlongRay;
      for (int j = 0; j < 5; j++) {
        float middle = (low + high) * 0.5;
        vec3 middlePoint = rayOrigin + rayDirection * middle;
        if (middlePoint.y > terrainHeight(middlePoint.xz)) {
          low = middle;
        } else {
          high = middle;
        }
      }
      hitDistance = (low + high) * 0.5;
      hit = true;
      break;
    }

    previousDistance = distanceAlongRay;
    distanceAlongRay += max(surfaceDistance * 0.55, 0.025);
    if (distanceAlongRay >= maxDistance) {
      break;
    }
  }

  if (!hit) {
    discard;
  }

  vec3 hitPoint = rayOrigin + rayDirection * hitDistance;
  vec3 normal = terrainNormal(hitPoint);
  vec3 lightDirection = normalize(vec3(-0.45, 0.8, 0.65));
  float diffuse = max(dot(normal, lightDirection), 0.0);
  float snowCover = smoothstep(-1.08, -0.82, hitPoint.y);
  vec3 nightGround = vec3(0.035, 0.09, 0.16);
  vec3 dayGround = vec3(0.12, 0.3, 0.22);
  vec3 groundColor = mix(nightGround, dayGround, uDayAmount);
  vec3 snowColor = mix(vec3(0.38, 0.49, 0.68), vec3(0.84, 0.93, 1.0), uDayAmount);
  vec3 color = mix(groundColor, snowColor, snowCover);
  color *= 0.42 + diffuse * 0.58;

  gl_FragColor = vec4(color, 1.0);
}
