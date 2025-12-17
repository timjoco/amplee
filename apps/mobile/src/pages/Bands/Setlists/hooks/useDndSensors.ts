import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

/**
 * DnD-kit sensor configuration hook.
 * Centralizes mouse/touch/keyboard sensor setup and activation constraints so
 * the editor can reuse consistent drag behavior across components.
 */

export function useDndSensors() {
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 4 },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 160, tolerance: 6 },
  });

  const keyboardSensor = useSensor(KeyboardSensor);

  return useSensors(mouseSensor, touchSensor, keyboardSensor);
}
