import { Box3, PerspectiveCamera, Vector2, Vector3 } from 'three';
import { GLTF, PointerLockControls } from 'three/examples/jsm/Addons';

export function lockMouseControl(pointerLockControls: PointerLockControls) {
  pointerLockControls.lock();
}

export function unlockMouseControl(pointerLockControls: PointerLockControls) {
  pointerLockControls.unlock();
}

export function move(value: Vector2, camera: PerspectiveCamera, moveSpeed: number) {
  const direction = new Vector3(value.x, 0, value.y).normalize();
  const angle = Math.atan2(
    camera.getWorldDirection(new Vector3()).x,
    camera.getWorldDirection(new Vector3()).z
  );
  direction.applyAxisAngle(new Vector3(0, 1, 0), angle);

  camera.position.add(direction.multiplyScalar(moveSpeed));
}

export function enableDebugMode(camera: PerspectiveCamera, doc: Document) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!camera) return;

    const moveSpeed = 0.5;
    const rotateSpeed = 0.02;
    switch (event.key) {
      case 'w': // Move forward
        move(new Vector2(0, 1), camera, moveSpeed);
        // camera.position.z -= moveSpeed;
        break;
      case 's': // Move backward
        move(new Vector2(0, -1), camera, moveSpeed);
        // camera.position.z += moveSpeed;
        break;
      case 'a': // Move left
        move(new Vector2(1, 0), camera, moveSpeed);
        // camera.position.x -= moveSpeed;
        break;
      case 'd': // Move right
        move(new Vector2(-1, 0), camera, moveSpeed);
        // camera.position.x += moveSpeed;
        break;
      case 'ArrowUp': // Rotate up
        camera.rotation.x -= rotateSpeed;
        break;
      case 'ArrowDown': // Rotate down
        camera.rotation.x += rotateSpeed;
        break;
      case 'ArrowLeft': // Rotate left
        camera.rotation.y -= rotateSpeed;
        break;
      case 'ArrowRight': // Rotate right
        camera.rotation.y += rotateSpeed;
        break;
      case 'r': // Reset camera position
        camera.position.set(0, 0, 5);
        camera.rotation.set(0, 0, 0);
        break;
    }
  };

  doc.addEventListener('keydown', handleKeyDown);
}

export function getMeshWorldCoordinates(meshName: string, model: GLTF) {
  const mesh = model.scene.getObjectByName(meshName);
  if (mesh) {
    return mesh.getWorldPosition(new Vector3());
  } else {
    console.error(`Mesh with name ${meshName} not found in the model.`);
    return null;
  }
}

export const convertImageBufferToBlobUrl = (imageBuffer: ArrayBuffer, type: string) => {
  const blob = new Blob([imageBuffer], { type });
  return URL.createObjectURL(blob);
};

/**
 * Converts a string with spaces into camelCase.
 * @param name - The string to convert.
 * @returns The camelCase version of the string.
 */
export function toCamelCase(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('');
}

export const getCarHood = (model: GLTF, rotation: number) => {
  const boundingBox = new Box3().setFromObject(model.scene);

  // Get the depth of the object
  const boxDepth = boundingBox.max.z - boundingBox.min.z;

  // Set the vector of the world origin applying the OXYZ axis that the current world is applying
  const forwardVector = new Vector3(0, 0, boxDepth / 2).applyQuaternion(model.scene.quaternion);
  // Rotate the forward vector by the model's rotation on Y axis
  forwardVector.applyAxisAngle(new Vector3(0, 1, 0), rotation);

  const testVector3 = new Vector3(0, 0, 0);
  // Get the center of the bounding box and add the forward vector to it
  boundingBox.getCenter(testVector3);
  testVector3.add(forwardVector);

  return testVector3;
};

export const getCarCenter = (model: GLTF, rotation: number) => {
  const boundingBox = new Box3().setFromObject(model.scene);

  // Get the depth of the object
  // const boxDepth = boundingBox.max.z - boundingBox.min.z;

  // Set the vector of the world origin applying the OXYZ axis that the current world is applying
  const forwardVector = new Vector3(0, 0, 0).applyQuaternion(model.scene.quaternion);
  // Rotate the forward vector by the model's rotation on Y axis
  forwardVector.applyAxisAngle(new Vector3(0, 1, 0), rotation);

  const testVector3 = new Vector3(0, 0, 0);
  // Get the center of the bounding box and add the forward vector to it
  boundingBox.getCenter(testVector3);
  testVector3.add(forwardVector);

  return testVector3;
};

export const getCarTail = (model: GLTF, rotation: number) => {
  const boundingBox = new Box3().setFromObject(model.scene);

  // Get the depth of the object
  const boxDepth = boundingBox.max.z - boundingBox.min.z;

  // Set the vector of the world origin applying the OXYZ axis that the current world is applying
  const forwardVector = new Vector3(0, 0, -boxDepth / 2).applyQuaternion(model.scene.quaternion);
  // Rotate the forward vector by the model's rotation on Y axis
  forwardVector.applyAxisAngle(new Vector3(0, 1, 0), rotation);

  const testVector3 = new Vector3(0, 0, 0);
  // Get the center of the bounding box and add the forward vector to it
  boundingBox.getCenter(testVector3);
  testVector3.add(forwardVector);

  return testVector3;
};

export const getCarRightSide = (model: GLTF, rotation: number) => {
  const boundingBox = new Box3().setFromObject(model.scene);

  // Get the depth of the object
  const boxDepth = boundingBox.max.x - boundingBox.min.x;

  // Set the vector of the world origin applying the OXYZ axis that the current world is applying
  const forwardVector = new Vector3(boxDepth / 2, 0, 0).applyQuaternion(model.scene.quaternion);
  // Rotate the forward vector by the model's rotation on Y axis
  forwardVector.applyAxisAngle(new Vector3(0, 1, 0), rotation);

  const testVector3 = new Vector3(0, 0, 0);
  // Get the center of the bounding box and add the forward vector to it
  boundingBox.getCenter(testVector3);
  testVector3.add(forwardVector);

  return testVector3;
};

export const getCarLeftSide = (model: GLTF, rotation: number) => {
  const boundingBox = new Box3().setFromObject(model.scene);

  // Get the depth of the object
  const boxDepth = boundingBox.max.x - boundingBox.min.x;

  // Set the vector of the world origin applying the OXYZ axis that the current world is applying
  const forwardVector = new Vector3(-boxDepth / 2, 0, 0).applyQuaternion(model.scene.quaternion);
  // Rotate the forward vector by the model's rotation on Y axis
  forwardVector.applyAxisAngle(new Vector3(0, 1, 0), rotation);

  const testVector3 = new Vector3(0, 0, 0);
  // Get the center of the bounding box and add the forward vector to it
  boundingBox.getCenter(testVector3);
  testVector3.add(forwardVector);

  return testVector3;
};

