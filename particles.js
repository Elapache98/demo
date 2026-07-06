console.log('particles.js script loaded!');

// Particle System using Three.js
let scene, camera, renderer, particles;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// Initialize the particle system
function initParticles() {
  console.log('Initializing particles...');
  const canvas = document.getElementById('particleCanvas');
  
  if (!canvas) {
    console.error('Canvas not found!');
    return;
  }
  
  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 500;
  
  // Renderer setup
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas,
    alpha: true,
    antialias: true 
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  
  console.log('Renderer created, canvas size:', window.innerWidth, window.innerHeight);
  
  // Create particles in a sphere formation
  const particleCount = 6000;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    // Create spherical distribution with more particles closer to center
    const radius = Math.random() * 600 + 150;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
    
    // Gold particles matching icon color (#947b57)
    const color = new THREE.Color();
    const baseColor = new THREE.Color('#947b57');
    
    // Add slight variation to the gold color
    const variation = 0.1;
    color.r = Math.max(0, Math.min(1, baseColor.r + (Math.random() - 0.5) * variation));
    color.g = Math.max(0, Math.min(1, baseColor.g + (Math.random() - 0.5) * variation));
    color.b = Math.max(0, Math.min(1, baseColor.b + (Math.random() - 0.5) * variation));
    
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  // Create circular particle texture
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 32;
  textureCanvas.height = 32;
  const ctx = textureCanvas.getContext('2d');
  
  // Create asteroid/laser gradient
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.3, 'rgba(200, 180, 255, 0.7)');
  gradient.addColorStop(0.7, 'rgba(100, 150, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  
  const texture = new THREE.CanvasTexture(textureCanvas);
  
  const material = new THREE.PointsMaterial({
    size: 3, // Slightly bigger for asteroid/laser effect
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    map: texture,
    alphaTest: 0.001,
    sizeAttenuation: true // Makes particles smaller when far away
  });
  
  particles = new THREE.Points(geometry, material);
  scene.add(particles);
  
  console.log('Particles created and added to scene');
  
  // Mouse event listeners
  document.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onWindowResize);
  
  animate();
}

// Mouse movement handler
function onMouseMove(event) {
  mouseX = (event.clientX - windowHalfX) * 0.5;
  mouseY = (event.clientY - windowHalfY) * 0.5;
}

// Window resize handler
function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Slower rotation
  particles.rotation.x += 0.0005;
  particles.rotation.y += 0.0008;
  
  // Gentler mouse interaction
  particles.rotation.x += mouseY * 0.000005;
  particles.rotation.y += mouseX * 0.000005;
  
  // Slower, more subtle movement - bigger particles move slower
  const positions = particles.geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    // Calculate distance from center to determine particle size
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    const distance = Math.sqrt(x * x + y * y + z * z);
    
    // Closer particles (bigger) move slower
    const speedMultiplier = Math.max(0.2, distance / 1000);
    
    positions[i + 1] += Math.sin(Date.now() * 0.0005 + i) * 0.05 * speedMultiplier;
  }
  particles.geometry.attributes.position.needsUpdate = true;
  
  renderer.render(scene, camera);
}

// Initialize when Three.js is loaded
function loadThreeJS() {
  console.log('Loading Three.js...');
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.onload = function() {
    console.log('Three.js loaded successfully');
    initParticles();
  };
  script.onerror = function() {
    console.error('Failed to load Three.js');
  };
  document.head.appendChild(script);
}

// Start loading Three.js when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadThreeJS);
} else {
  loadThreeJS();
} 