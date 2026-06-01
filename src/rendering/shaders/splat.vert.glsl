precision highp float;

attribute vec2 corner;

attribute vec3 instancePosition;
attribute vec3 instanceColor;
attribute vec3 instanceNormal;
attribute float instanceSize;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uPointScale;
uniform float uMinPointSize;
uniform float uMaxPointSize;
uniform float uViewportHeight;

varying vec3 vColor;
varying vec3 vNormal;
varying vec2 vUv;
varying float vPointSize;
varying vec3 vViewPosition;
varying float vDepth;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(instancePosition, 1.0);
    vViewPosition = mvPosition.xyz;
    vDepth = -mvPosition.z;
    
    float dist = length(mvPosition.xyz);
    float size = instanceSize * uPointScale * (uViewportHeight / dist);
    size = clamp(size, uMinPointSize, uMaxPointSize);
    
    vec3 right = vec3(modelViewMatrix[0].x, modelViewMatrix[1].x, modelViewMatrix[2].x);
    vec3 up = vec3(modelViewMatrix[0].y, modelViewMatrix[1].y, modelViewMatrix[2].y);
    
    vec3 offset = (right * corner.x + up * corner.y) * size * 0.5;
    vec4 worldPos = mvPosition + vec4(offset, 0.0);
    
    vPointSize = size;
    vUv = corner * 0.5 + 0.5;
    vColor = instanceColor;
    vNormal = normalize((modelViewMatrix * vec4(instanceNormal, 0.0)).xyz);
    
    gl_Position = projectionMatrix * worldPos;
}
