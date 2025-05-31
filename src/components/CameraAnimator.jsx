import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSpring, config as springConfig } from '@react-spring/three';
import * as THREE from 'three';

const CameraAnimator = ({ targetPosition, targetDistance, isActive, controlsRef, onAnimationComplete }) => {
  const { camera } = useThree();
  const isAnimating = useRef(false); // Per tracciare se lo spring sta attivamente animando

  // Memoizza la posizione calcolata della camera per evitare ricalcoli inutili se il target non cambia
  const desiredCameraPositionVec = useMemo(() => {
    if (!targetPosition) return null; // Se non c'è targetPosition, non calcolare
    const offset = new THREE.Vector3(0, 1.5, targetDistance || 5);
    return new THREE.Vector3().addVectors(targetPosition, offset);
  }, [targetPosition, targetDistance]);

  const [springProps, api] = useSpring(() => ({
    // Inizializza con i valori correnti della camera e del target per evitare salti iniziali
    // Questi verranno aggiornati dall'useEffect quando isActive cambia
    cameraPos: camera.position.toArray(),
    controlsTargetPos: controlsRef.current ? controlsRef.current.target.toArray() : [0, 0, 0],
    config: { ...springConfig.gentle, precision: 0.0001 }, // Usiamo una config per l'animazione
    onStart: () => { isAnimating.current = true; },
    onRest: () => {
      isAnimating.current = false;
      if (isActive && typeof onAnimationComplete === 'function') {
        // Chiamato quando l'animazione di focus è completata e isActive era true
        onAnimationComplete();
      }
    }
  }));

  useEffect(() => {
    if (isActive && desiredCameraPositionVec && targetPosition) {
      // Quando attiviamo il focus, partiamo dalla posizione attuale della camera/target per l'animazione
      api.start({
        from: {
          cameraPos: camera.position.toArray(),
          controlsTargetPos: controlsRef.current ? controlsRef.current.target.toArray() : targetPosition.toArray(),
        },
        to: {
          cameraPos: desiredCameraPositionVec.toArray(),
          controlsTargetPos: targetPosition.toArray(),
        },
        onChange: (result) => {
          // Se si vuole applicare direttamente i valori durante l'animazione senza lerp in useFrame
          // camera.position.fromArray(result.value.cameraPos);
          // if (controlsRef.current) {
          //    controlsRef.current.target.fromArray(result.value.controlsTargetPos);
          // }
        }
      });
    } else if (!isActive) {
      // Se non è attivo, vogliamo che lo spring smetta di guidare la camera.
      // Fermiamo l'animazione e resettiamo i valori dello spring alla posizione/target attuale della camera
      // in modo che il prossimo useFrame non tenti di lerpare a un vecchio target.
      api.stop(); // Ferma animazioni in corso
      api.set({
        cameraPos: camera.position.toArray(),
        controlsTargetPos: controlsRef.current ? controlsRef.current.target.toArray() : [0, 0, 0],
      });
      isAnimating.current = false;
    }
  }, [isActive, desiredCameraPositionVec, targetPosition, api, camera, controlsRef]);

  useFrame(() => {
    // console.log("CAMERA ANIMATING?", isActive, isAnimating.current);
    // Applica l'interpolazione solo se l'animazione di focus è attiva E lo spring sta animando
    if (isActive && isAnimating.current && controlsRef.current) {
      // Ottieni i valori correnti dallo spring (non più necessario se onChange li applica)
      const currentSpringCamPos = springProps.cameraPos.get();
      const currentSpringControlsTarget = springProps.controlsTargetPos.get();

      camera.position.lerp(new THREE.Vector3(...currentSpringCamPos), 0.15); // Interpolazione più dolce
      controlsRef.current.target.lerp(new THREE.Vector3(...currentSpringControlsTarget), 0.15);
      controlsRef.current.update();
    } else if (!isActive && controlsRef.current) {
      // Assicurati che OrbitControls possa aggiornare se non stiamo animando
      // Questo potrebbe non essere necessario se OrbitControls gestisce i suoi update
      // controlsRef.current.update();
    }
  });

  return null; // Questo componente non renderizza nulla di visibile
};

export default CameraAnimator;
