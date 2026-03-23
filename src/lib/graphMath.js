export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function createDefaultNodeState(nodes) {
  const next = {};

  nodes.forEach((node) => {
    next[node.id] = Math.round(node.baseValue * 100);
  });

  return next;
}

export function calculateGraphState(nodes, edges, nutrientValues, tuning) {
  const baseValues = {};
  const sourceValues = {};
  const sourceDeltas = {};
  const firstOrder = {};
  const secondOrder = {};
  const edgeActivity = {};
  const edgeContributions = {};

  nodes.forEach((node) => {
    baseValues[node.id] = node.baseValue;
    sourceValues[node.id] = clamp((nutrientValues[node.id] ?? node.baseValue * 100) / 100);
    sourceDeltas[node.id] = sourceValues[node.id] - node.baseValue;
    firstOrder[node.id] = 0;
    secondOrder[node.id] = 0;
  });

  edges.forEach((edge) => {
    const edgeKey = `${edge.source}:${edge.target}:${edge.relationshipType}`;
    const factor = edge.relationshipType === 'synergistic' ? tuning.synergyFactor : tuning.antagonismFactor;
    const sourceDelta = sourceDeltas[edge.source] ?? 0;
    const driver = edge.relationshipType === 'synergistic' ? sourceDelta : Math.max(0, sourceDelta);
    const signedEffect = edge.relationshipType === 'synergistic'
      ? edge.weight * driver * factor
      : -edge.weight * driver * factor;

    firstOrder[edge.target] += signedEffect;
    edgeContributions[edgeKey] = {
      source: edge.source,
      target: edge.target,
      relationshipType: edge.relationshipType,
      directEffect: signedEffect,
      dampedEffect: 0,
      totalEffect: signedEffect,
    };
  });

  const intermediateValues = {};
  const intermediateDeltas = {};

  nodes.forEach((node) => {
    intermediateValues[node.id] = clamp(baseValues[node.id] + firstOrder[node.id]);
    intermediateDeltas[node.id] = intermediateValues[node.id] - baseValues[node.id];
  });

  edges.forEach((edge) => {
    const edgeKey = `${edge.source}:${edge.target}:${edge.relationshipType}`;
    const factor = edge.relationshipType === 'synergistic' ? tuning.synergyFactor : tuning.antagonismFactor;
    const propagatedDelta = intermediateDeltas[edge.source] ?? 0;
    const driver = edge.relationshipType === 'synergistic' ? propagatedDelta : Math.max(0, propagatedDelta);
    const signedEffect = edge.relationshipType === 'synergistic'
      ? edge.weight * driver * factor * tuning.secondOrderDamping
      : -edge.weight * driver * factor * tuning.secondOrderDamping;

    secondOrder[edge.target] += signedEffect;
    if (edgeContributions[edgeKey]) {
      edgeContributions[edgeKey].dampedEffect = signedEffect;
      edgeContributions[edgeKey].totalEffect += signedEffect;
    }

    const sourceShift = Math.abs(sourceDeltas[edge.source]);
    const targetShift = Math.abs(firstOrder[edge.target]) + Math.abs(secondOrder[edge.target]) * 0.6;
    edgeActivity[edgeKey] = clamp(
      0.18 + sourceShift * 1.1 + targetShift + edge.weight * 0.15,
      0,
      1,
    );
  });

  const computedNodes = nodes.map((node) => {
    const availabilityScore = clamp(baseValues[node.id] + firstOrder[node.id] + secondOrder[node.id]);
    const displayValue = sourceValues[node.id];
    const changeStrength = displayValue - baseValues[node.id];

    return {
      ...node,
      availabilityScore,
      displayValue,
      delta: availabilityScore - node.baseValue,
      changeStrength,
    };
  });

  return {
    nodes: computedNodes,
    edges,
    edgeActivity,
    edgeContributions,
    firstOrder,
    secondOrder,
  };
}

export function createPersistedGraph(graph, nutrientValues) {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      const baseValue = clamp((nutrientValues[node.id] ?? node.baseValue * 100) / 100);
      return {
        ...node,
        baseValue,
        availabilityScore: baseValue,
      };
    }),
  };
}