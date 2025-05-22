import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const allTopics = [
  { id: 1, title: 'Filosofia', reflections: 13 },
  { id: 2, title: 'Spiritualità', reflections: 21 },
  { id: 3, title: 'Tecnologia', reflections: 8 },
  { id: 4, title: 'Arte', reflections: 17 },
  { id: 5, title: 'Psiche', reflections: 10 },
];

function ThreeDWorld({ selectedTopic, onBubbleClick }) {
  const mountRef = useRef(null);
  const bubbleRefs = useRef([]);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070b34');

    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const spot = new THREE.SpotLight(0xffffff, 1);
    spot.position.set(30, 30, 30);
    scene.add(spot);

    const bubbles = [];
    const filteredTopics =
      selectedTopic === 'Tutti'
        ? allTopics
        : allTopics.filter((t) => t.title === selectedTopic);

    filteredTopics.forEach((topic, i) => {
      const size = 1 + topic.reflections * 0.05;
      const geometry = new THREE.SphereGeometry(size, 64, 64);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(`hsl(${i * 60}, 100%, 60%)`),
        roughness: 0.3,
        metalness: 0.2,
      });

      const bubble = new THREE.Mesh(geometry, material);
      bubble.userData = { topic };
      scene.add(bubble);

      bubbles.push({
        mesh: bubble,
        angle: (i / filteredTopics.length) * Math.PI * 2,
      });
    });

    bubbleRefs.current = bubbles;

    const animate = () => {
      requestAnimationFrame(animate);

      bubbleRefs.current.forEach((bubble, i) => {
        bubble.angle += 0.01;
        const radius = 10;
        bubble.mesh.position.x = Math.cos(bubble.angle) * radius;
        bubble.mesh.position.z = Math.sin(bubble.angle) * radius;
        bubble.mesh.rotation.y += 0.005;
      });

      renderer.render(scene, camera);
    };

    animate();

    const onClick = (event) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        bubbleRefs.current.map((b) => b.mesh)
      );

      if (intersects.length > 0 && onBubbleClick) {
        const bubble = intersects[0].object;
        onBubbleClick(bubble.userData.topic);

        // ANIMAZIONE: pulsazione scala
        const originalScale = bubble.scale.clone();
        const targetScale = originalScale.clone().multiplyScalar(1.2);

        let t = 0;
        const pulse = () => {
          t += 0.1;
          const scale = originalScale.clone().lerp(targetScale, Math.sin(t) * 0.5);
          bubble.scale.set(scale.x, scale.y, scale.z);

          if (t < Math.PI) {
            requestAnimationFrame(pulse);
          } else {
            bubble.scale.copy(originalScale);
          }
        };

        pulse();
      }
    };

    renderer.domElement.addEventListener('click', onClick);

    return () => {
      mountRef.current.removeChild(renderer.domElement);
      renderer.domElement.removeEventListener('click', onClick);
    };
  }, [selectedTopic]);

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
}

export default ThreeDWorld;
