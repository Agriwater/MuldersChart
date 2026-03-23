import { useMemo } from 'react';

const mulderPositions = {
  N: [0.2, 7.35, 0],
  P: [5.1, 6.05, 0],
  K: [7.1, 2.75, 0],
  Ca: [7.05, -1.05, 0],
  Mg: [5.45, -4.95, 0],
  S: [1.95, -7.15, 0],
  Fe: [-2.05, -7.1, 0],
  Mn: [-5.5, -5.35, 0],
  Zn: [-7.2, -2.9, 0],
  Cu: [-7.25, 0.95, 0],
  B: [-5.95, 4.35, 0],
  Mo: [-2.95, 6.55, 0],
};

const nodeScaleFactor = 0.7;

function getRenderedRadius(node) {
  const liveScale = node.size * (0.82 + node.displayValue * 0.85 + node.availabilityScore * 0.45) * nodeScaleFactor;
  return 0.9 * liveScale;
}

function relaxPositions(nodes) {
  const positions = {};
  const anchors = {};
  const radii = {};

  nodes.forEach((node, index) => {
    const fallbackAngle = (-Math.PI / 2) + (index / nodes.length) * Math.PI * 2;
    const fallbackPosition = [
      Math.cos(fallbackAngle) * 6,
      Math.sin(fallbackAngle) * 6,
      0,
    ];

    const anchor = mulderPositions[node.id] ?? fallbackPosition;
    anchors[node.id] = { x: anchor[0], y: anchor[1] };
    positions[node.id] = { x: anchor[0], y: anchor[1] };
    radii[node.id] = getRenderedRadius(node);
  });

  for (let iteration = 0; iteration < 80; iteration += 1) {
    for (let index = 0; index < nodes.length; index += 1) {
      const currentNode = nodes[index];
      const currentPosition = positions[currentNode.id];

      for (let compareIndex = index + 1; compareIndex < nodes.length; compareIndex += 1) {
        const otherNode = nodes[compareIndex];
        const otherPosition = positions[otherNode.id];
        const deltaX = otherPosition.x - currentPosition.x;
        const deltaY = otherPosition.y - currentPosition.y;
        const distance = Math.hypot(deltaX, deltaY) || 0.0001;
        const minDistance = radii[currentNode.id] + radii[otherNode.id] + 0.6;

        if (distance >= minDistance) {
          continue;
        }

        const overlap = minDistance - distance;
        const pushX = (deltaX / distance) * overlap * 0.5;
        const pushY = (deltaY / distance) * overlap * 0.5;

        currentPosition.x -= pushX;
        currentPosition.y -= pushY;
        otherPosition.x += pushX;
        otherPosition.y += pushY;
      }
    }

    nodes.forEach((node) => {
      const anchor = anchors[node.id];
      const position = positions[node.id];
      position.x += (anchor.x - position.x) * 0.08;
      position.y += (anchor.y - position.y) * 0.08;
    });
  }

  const resolvedPositions = {};
  nodes.forEach((node) => {
    const position = positions[node.id];
    resolvedPositions[node.id] = [position.x, position.y, 0];
  });

  return resolvedPositions;
}

export function useGraphLayout(nodes, edges) {
  return useMemo(() => {
    if (!nodes.length) {
      return {};
    }

    return relaxPositions(nodes);
  }, [nodes, edges]);
}