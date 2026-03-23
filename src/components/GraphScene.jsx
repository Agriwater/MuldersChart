import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useGraphLayout } from '../hooks/useGraphLayout';

const antagonisticColor = '#c81d4f';
const antagonisticAccent = '#ef476f';
const synergisticColor = '#1f8a4c';
const synergisticAccent = '#38b000';
const nodeScaleFactor = 0.7;
const badgeFace = '#123f66';
const badgeInnerFace = '#0d3150';
const badgeRim = '#d8b45c';
const badgeOuterShadow = '#c7d9e8';
const sourceHighlightColor = '#f59e0b';
const sceneOffset = [0, -0.35, 0];
const sceneScale = 0.82;
const fitPadding = 1.12;
const badgeTopText = 'OPTIMAL NUTRIENT BALANCE';
const badgeBottomText = 'FOR PLANT GROWTH';

function getNodeRenderedRadius(node) {
  return node.size * (0.82 + node.displayValue * 0.85 + node.availabilityScore * 0.45) * nodeScaleFactor * 0.9;
}

function getHighlightFade(highlightState) {
  if (!highlightState) {
    return 0;
  }

  const elapsed = Date.now() - highlightState.startedAt;
  if (elapsed >= highlightState.durationMs) {
    return 0;
  }

  return 1 - (elapsed / highlightState.durationMs);
}

function drawArcText(context, text, centerX, centerY, radius, centerAngle, reverse = false) {
  const characters = text.split('');
  const spacing = 2;
  const widths = characters.map((character) => context.measureText(character).width + spacing);
  const totalArcLength = widths.reduce((sum, width) => sum + width, 0);
  const totalAngle = totalArcLength / radius;

  let currentAngle = reverse ? centerAngle + totalAngle / 2 : centerAngle - totalAngle / 2;

  characters.forEach((character, index) => {
    const charAngle = widths[index] / radius;
    currentAngle += reverse ? -charAngle / 2 : charAngle / 2;

    context.save();
    context.translate(centerX + Math.cos(currentAngle) * radius, centerY + Math.sin(currentAngle) * radius);
    context.rotate(currentAngle + (reverse ? -Math.PI / 2 : Math.PI / 2));
    context.fillText(character, 0, 0);
    context.restore();

    currentAngle += reverse ? -charAngle / 2 : charAngle / 2;
  });
}

function createBalanceBadgeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext('2d');

  if (!context) {
    return null;
  }

  const centerX = 512;
  const centerY = 512;

  context.clearRect(0, 0, canvas.width, canvas.height);

  const outerGradient = context.createRadialGradient(centerX, centerY, 220, centerX, centerY, 470);
  outerGradient.addColorStop(0, '#ffffff');
  outerGradient.addColorStop(1, '#eef5fb');
  context.fillStyle = outerGradient;
  context.beginPath();
  context.arc(centerX, centerY, 458, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(centerX, centerY, 418, 0, Math.PI * 2);
  context.fill();

  const innerGradient = context.createRadialGradient(centerX, centerY - 120, 80, centerX, centerY, 330);
  innerGradient.addColorStop(0, '#f8fcff');
  innerGradient.addColorStop(1, '#dceef8');
  context.fillStyle = innerGradient;
  context.beginPath();
  context.arc(centerX, centerY, 312, 0, Math.PI * 2);
  context.fill();

  context.font = 'bold 42px Arial';
  context.fillStyle = '#1f2937';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  drawArcText(context, badgeTopText, centerX, centerY, 378, -Math.PI / 2, false);
  drawArcText(context, badgeBottomText, centerX, centerY, 378, Math.PI / 2, true);

  context.fillStyle = '#2f855a';
  context.beginPath();
  context.arc(centerX - 360, centerY, 10, 0, Math.PI * 2);
  context.arc(centerX + 360, centerY, 10, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#7c5234';
  context.beginPath();
  context.moveTo(248, 610);
  context.quadraticCurveTo(384, 580, 512, 604);
  context.quadraticCurveTo(660, 578, 776, 610);
  context.lineTo(776, 760);
  context.quadraticCurveTo(512, 802, 248, 760);
  context.closePath();
  context.fill();

  context.strokeStyle = '#f5ede0';
  context.lineWidth = 10;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(512, 604);
  context.lineTo(512, 724);
  context.moveTo(512, 650);
  context.bezierCurveTo(482, 680, 468, 702, 440, 724);
  context.moveTo(512, 670);
  context.bezierCurveTo(548, 690, 566, 712, 596, 740);
  context.moveTo(512, 680);
  context.bezierCurveTo(500, 706, 492, 726, 492, 760);
  context.moveTo(512, 666);
  context.bezierCurveTo(534, 688, 548, 710, 554, 748);
  context.moveTo(512, 666);
  context.bezierCurveTo(486, 692, 474, 710, 466, 744);
  context.stroke();

  context.strokeStyle = '#146c43';
  context.lineWidth = 16;
  context.beginPath();
  context.moveTo(512, 604);
  context.lineTo(512, 360);
  context.stroke();

  function leaf(x, y, scaleX, scaleY, rotation, colorA, colorB) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    const gradient = context.createLinearGradient(-50, -20, 60, 60);
    gradient.addColorStop(0, colorA);
    gradient.addColorStop(1, colorB);
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(0, 0);
    context.bezierCurveTo(50 * scaleX, -40 * scaleY, 140 * scaleX, -20 * scaleY, 165 * scaleX, 30 * scaleY);
    context.bezierCurveTo(122 * scaleX, 76 * scaleY, 52 * scaleX, 88 * scaleY, 0, 0);
    context.fill();
    context.strokeStyle = 'rgba(230,255,230,0.75)';
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(10, 8);
    context.lineTo(130 * scaleX, 34 * scaleY);
    context.moveTo(70 * scaleX, 22 * scaleY);
    context.lineTo(42 * scaleX, 50 * scaleY);
    context.moveTo(96 * scaleX, 28 * scaleY);
    context.lineTo(72 * scaleX, 58 * scaleY);
    context.stroke();
    context.restore();
  }

  leaf(512, 360, 0.9, 0.95, -0.62, '#5ecf57', '#0f7b3f');
  leaf(512, 360, -0.9, 0.95, 0.62, '#5ecf57', '#0f7b3f');
  leaf(512, 266, 0.46, 0.52, -0.24, '#8edb59', '#43a047');
  leaf(512, 266, -0.46, 0.52, 0.24, '#8edb59', '#43a047');

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function BalanceHub() {
  const badgeTexture = useMemo(() => createBalanceBadgeTexture(), []);

  return (
    <group position={[0, 0, 0.18]} renderOrder={40}>
      <mesh position={[0, 0, -0.03]} renderOrder={40}>
        <circleGeometry args={[1.9, 96]} />
        <meshBasicMaterial color="#dceaf4" transparent opacity={0.32} depthTest={false} depthWrite={false} />
      </mesh>
      {badgeTexture ? (
        <mesh renderOrder={41}>
          <circleGeometry args={[1.76, 128]} />
          <meshBasicMaterial map={badgeTexture} transparent depthTest={false} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}

function NodeMesh({ node, position, highlightState }) {
  const auraRef = useRef(null);
  const medalRef = useRef(null);

  useFrame((_, delta) => {
    if (!medalRef.current || !auraRef.current) {
      return;
    }

    const targetScale = node.size * (0.82 + node.displayValue * 0.85 + node.availabilityScore * 0.45) * nodeScaleFactor;
    const eased = 1 - Math.exp(-delta * 5);
    const fade = getHighlightFade(highlightState);
    const nodeHighlight = highlightState?.nodeHighlights?.[node.id] ?? null;
    const isSource = highlightState?.sourceId === node.id;
    const highlightBoost = isSource ? 0.12 * fade : nodeHighlight ? 0.06 * fade : 0;

    medalRef.current.scale.setScalar(THREE.MathUtils.lerp(medalRef.current.scale.x, targetScale * (1 + highlightBoost), eased));
    auraRef.current.scale.setScalar(THREE.MathUtils.lerp(auraRef.current.scale.x, targetScale * 1.12, eased));
    let auraOpacity = 0;
    let auraColor = node.color;

    if (isSource && fade > 0) {
      auraOpacity = 0.26 * fade;
      auraColor = sourceHighlightColor;
    } else if (nodeHighlight && fade > 0) {
      auraOpacity = (0.18 + Math.min(nodeHighlight.magnitude * 0.9, 0.2)) * fade;
      auraColor = nodeHighlight.sign === 'positive' ? synergisticAccent : antagonisticAccent;
    }

    auraRef.current.material.opacity = THREE.MathUtils.lerp(auraRef.current.material.opacity, auraOpacity, eased);
    auraRef.current.material.color.lerp(new THREE.Color(auraColor), eased);
  });

  return (
    <group position={position}>
      <mesh ref={auraRef} position={[0, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.98, 0.98, 0.08, 60]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.14} />
      </mesh>
      <group ref={medalRef}>
        <mesh position={[0, 0, -0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 0.18, 60]} />
          <meshBasicMaterial color={badgeOuterShadow} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.82, 0.82, 0.14, 60]} />
          <meshBasicMaterial color={badgeRim} />
        </mesh>
        <mesh position={[0, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.68, 0.68, 0.12, 60]} />
          <meshBasicMaterial color={badgeFace} />
        </mesh>
        <mesh position={[0, 0, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.58, 0.58, 0.05, 60]} />
          <meshBasicMaterial color={badgeInnerFace} />
        </mesh>
        <Text position={[0, 0.13, 0.12]} fontSize={0.42} color="#f8fafc" anchorX="center" anchorY="middle">
          {node.id}
        </Text>
        <Text position={[0, -0.20, 0.12]} fontSize={0.16} color="#f8fafc" maxWidth={1.02} lineHeight={1.05} textAlign="center" anchorX="center" anchorY="middle">
          {node.label}
        </Text>
        <Text
          position={[0, -0.36, 0.12]}
          fontSize={0.16}
          color="#f8fafc"
          maxWidth={0.9}
          textAlign="center"
          outlineColor="#133c63"
          outlineWidth={0.006}
          anchorX="center"
          anchorY="middle"
        >
          {`${Math.round(node.availabilityScore * 100)}%`}
        </Text>
      </group>
    </group>
  );
}

function EdgeLink({ edge, positions, activity, highlightState }) {
  const arrowRef = useRef(null);
  const source = positions[edge.source];
  const target = positions[edge.target];

  if (!source || !target) {
    return null;
  }

  const sourceVector = new THREE.Vector3(...source);
  const targetVector = new THREE.Vector3(...target);
  const midpoint = sourceVector.clone().lerp(targetVector, 0.5);
  const towardCenter = midpoint.clone().multiplyScalar(-0.18);
  const control = midpoint.add(towardCenter);
  const edgeColor = edge.relationshipType === 'antagonistic'
    ? (activity > 0.55 ? antagonisticAccent : antagonisticColor)
    : (activity > 0.55 ? synergisticAccent : synergisticColor);
  const edgeKey = `${edge.source}:${edge.target}:${edge.relationshipType}`;
  const curve = new THREE.QuadraticBezierCurve3(sourceVector, control, targetVector);
  const linePoints = curve.getPoints(42).map((point) => point.toArray());
  const isPrimary = edge.weight >= 0.75;
  const lineWidth = isPrimary ? 5.2 : 1.9;
  const baseLineOpacity = isPrimary ? 0.34 + activity * 0.18 : 0.48 + activity * 0.24;
  const arrowRadius = isPrimary ? 0.22 : 0.12;
  const arrowLength = isPrimary ? 0.52 : 0.3;

  useFrame((state) => {
    if (!arrowRef.current) {
      return;
    }

    const speed = isPrimary
      ? 0.01 + activity * 0.03
      : 0.026 + activity * 0.07;
    const offset = ((state.clock.elapsedTime * speed) % 0.78) + 0.12;
    const point = curve.getPointAt(offset);
    const tangent = curve.getTangentAt(offset).normalize();
    arrowRef.current.position.copy(point);
    arrowRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  });

  const fade = getHighlightFade(highlightState);
  const edgeHighlight = highlightState?.edgeHighlights?.[edgeKey] ?? null;
  const activeColor = edgeHighlight
    ? (edgeHighlight.sign === 'positive' ? synergisticAccent : antagonisticAccent)
    : edgeColor;
  const highlightWidthBoost = edgeHighlight ? (isPrimary ? 2.2 : 1.4) * fade : 0;
  const lineOpacity = edgeHighlight ? Math.min(0.95, baseLineOpacity + 0.24 * fade) : baseLineOpacity;
  const arrowOpacity = edgeHighlight ? Math.min(0.98, 0.72 + fade * 0.26) : 0.92;
  const glowWidth = edgeHighlight ? (lineWidth + highlightWidthBoost) * (isPrimary ? 2.9 : 3.6) : 0;
  const glowOpacity = edgeHighlight ? Math.min(0.32, 0.1 + fade * 0.18) : 0;

  return (
    <group>
      {edgeHighlight ? (
        <Line
          points={linePoints}
          color={activeColor}
          lineWidth={glowWidth}
          transparent
          opacity={glowOpacity}
        />
      ) : null}
      <Line
        points={linePoints}
        color={activeColor}
        lineWidth={lineWidth + highlightWidthBoost}
        transparent
        opacity={lineOpacity}
      />
      <mesh ref={arrowRef} renderOrder={10}>
        <coneGeometry args={[arrowRadius, arrowLength, 18]} />
        <meshBasicMaterial color={activeColor} transparent opacity={arrowOpacity} />
      </mesh>
    </group>
  );
}

function CameraFitter({ graphState, positions, controlsRef }) {
  const { camera, size } = useThree();

  const framing = useMemo(() => {
    const nodes = graphState.nodes
      .map((node) => {
        const position = positions[node.id];
        if (!position) {
          return null;
        }

        const radius = getNodeRenderedRadius(node);
        return {
          minX: (position[0] - radius) * sceneScale,
          maxX: (position[0] + radius) * sceneScale,
          minY: (position[1] - radius) * sceneScale + sceneOffset[1],
          maxY: (position[1] + radius) * sceneScale + sceneOffset[1],
        };
      })
      .filter(Boolean);

    const hubRadius = 1.9 * sceneScale;
    nodes.push({
      minX: -hubRadius,
      maxX: hubRadius,
      minY: -hubRadius + sceneOffset[1],
      maxY: hubRadius + sceneOffset[1],
    });

    const bounds = nodes.reduce((accumulator, nodeBounds) => ({
      minX: Math.min(accumulator.minX, nodeBounds.minX),
      maxX: Math.max(accumulator.maxX, nodeBounds.maxX),
      minY: Math.min(accumulator.minY, nodeBounds.minY),
      maxY: Math.max(accumulator.maxY, nodeBounds.maxY),
    }), {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    });

    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(1, bounds.maxY - bounds.minY);

    return {
      centerX: (bounds.minX + bounds.maxX) / 2,
      centerY: (bounds.minY + bounds.maxY) / 2,
      width,
      height,
    };
  }, [graphState.nodes, positions]);

  useEffect(() => {
    if (!size.width || !size.height) {
      return;
    }

    const horizontalZoom = size.width / (framing.width * fitPadding);
    const verticalZoom = size.height / (framing.height * fitPadding);
    const nextZoom = Math.max(10, Math.min(horizontalZoom, verticalZoom));

    camera.position.set(framing.centerX, framing.centerY, 20);
    camera.zoom = nextZoom;
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.set(framing.centerX, framing.centerY, 0);
      controlsRef.current.update();
    }
  }, [camera, controlsRef, framing, size.height, size.width]);

  return null;
}

export default function GraphScene({ graphState, highlightState = null }) {
  const positions = useGraphLayout(graphState.nodes, graphState.edges);
  const controlsRef = useRef(null);

  return (
    <div className="scene-shell">
      <Canvas orthographic camera={{ position: [0, 0, 20], zoom: 34 }} dpr={[1, 1.75]}>
        <color attach="background" args={['#f7fbff']} />
        <ambientLight intensity={1} color="#ffffff" />
        <CameraFitter graphState={graphState} positions={positions} controlsRef={controlsRef} />
        <group position={sceneOffset} rotation={[0, 0, 0]} scale={sceneScale}>
          <BalanceHub />
          {graphState.edges.map((edge) => (
            <EdgeLink
              key={`${edge.source}-${edge.target}-${edge.relationshipType}`}
              edge={edge}
              positions={positions}
              activity={graphState.edgeActivity[`${edge.source}:${edge.target}:${edge.relationshipType}`] ?? 0.25}
              highlightState={highlightState}
            />
          ))}
          {graphState.nodes.map((node) => (
            <NodeMesh key={node.id} node={node} position={positions[node.id] ?? [0, 0, 0]} highlightState={highlightState} />
          ))}
        </group>
        <OrbitControls
          ref={controlsRef}
          enableRotate={false}
          enablePan
          mouseButtons={{
            LEFT: THREE.MOUSE.DOLLY,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={{
            ONE: THREE.TOUCH.DOLLY_PAN,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
          target={[0, -0.2, 0]}
          minZoom={10}
          maxZoom={90}
        />
      </Canvas>
    </div>
  );
}