precision highp float;

varying vec3 vColor;
varying vec3 vNormal;
varying vec2 vUv;
varying float vPointSize;
varying vec3 vViewPosition;
varying float vDepth;

uniform float uSigma;
uniform float uAlphaThreshold;
uniform float uBrightness;
uniform bool uShowNormals;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;

void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center) * 2.0;
    
    float sigma = uSigma;
    float alpha = exp(-(dist * dist) / (2.0 * sigma * sigma));
    
    if (alpha < uAlphaThreshold) {
        discard;
    }
    
    vec3 baseColor = vColor;
    if (uShowNormals) {
        baseColor = vNormal * 0.5 + 0.5;
    }
    
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPosition - vViewPosition);
    vec3 viewDir = normalize(-vViewPosition);
    vec3 halfDir = normalize(lightDir + viewDir);
    
    float diff = max(dot(normal, lightDir), 0.0);
    float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
    
    vec3 ambient = uAmbientColor * baseColor;
    vec3 diffuse = uLightColor * baseColor * diff;
    vec3 specular = uLightColor * spec * 0.3;
    
    vec3 finalColor = (ambient + diffuse + specular) * uBrightness;
    
    gl_FragColor = vec4(finalColor * alpha, alpha);
}
