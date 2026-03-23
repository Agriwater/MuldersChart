import { useEffect, useMemo, useRef, useState } from 'react';
import GraphScene from './components/GraphScene';
import ControlPanel from './components/ControlPanel';
import RelationshipEditor from './components/RelationshipEditor';
import TermsPage from './components/TermsPage';
import { calculateGraphState, createDefaultNodeState, createPersistedGraph } from './lib/graphMath';

const buildLabel = `v${__APP_VERSION__} · ${__APP_COMMIT__}`;

const nutrientDescriptions = {
  N: 'Primary driver of leafy growth, canopy expansion, and protein demand.',
  P: 'Energy-transfer nutrient that underpins roots, flowering, and early vigor.',
  K: 'Water-balance and transport regulator tied to strength, movement, and stress handling.',
  Ca: 'Structural nutrient for cell walls, growing points, and tissue firmness.',
  Mg: 'Core chlorophyll nutrient that supports photosynthesis and enzyme activity.',
  S: 'Protein-building nutrient that works closely with amino acids and nitrogen use.',
  Fe: 'Redox and chlorophyll-support micronutrient tied to active green growth.',
  Zn: 'Micronutrient involved in enzyme activity, hormones, and compact growth.',
  Mn: 'Photosynthetic and enzymatic micronutrient supporting metabolic turnover.',
  Cu: 'Micronutrient linked to redox enzymes, tissue strength, and reproductive activity.',
  B: 'Cell-wall and transport micronutrient important for growing tips and movement of sugars.',
  Mo: 'Trace nutrient for nitrate conversion and efficient nitrogen metabolism.',
};

function formatLabelList(labels) {
  if (labels.length === 0) {
    return '';
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

function createElementGuide(nodes, edges) {
  const labelById = Object.fromEntries(nodes.map((node) => [node.id, node.label]));

  return Object.fromEntries(nodes.map((node) => {
    const outgoingAntagonists = edges
      .filter((edge) => edge.source === node.id && edge.relationshipType === 'antagonistic')
      .map((edge) => labelById[edge.target])
      .filter(Boolean);
    const outgoingSynergies = edges
      .filter((edge) => edge.source === node.id && edge.relationshipType === 'synergistic')
      .map((edge) => labelById[edge.target])
      .filter(Boolean);
    const incomingAntagonists = edges
      .filter((edge) => edge.target === node.id && edge.relationshipType === 'antagonistic')
      .map((edge) => labelById[edge.source])
      .filter(Boolean);

    const lowNotes = [];
    const highNotes = [];

    if (outgoingSynergies.length > 0) {
      lowNotes.push(`Lower levels reduce its supportive pull on ${formatLabelList(outgoingSynergies)}.`);
    }

    if (incomingAntagonists.length > 0) {
      lowNotes.push(`It is also more exposed when ${formatLabelList(incomingAntagonists)} run high.`);
    }

    if (outgoingAntagonists.length > 0) {
      highNotes.push(`High levels can push down ${formatLabelList(outgoingAntagonists)}.`);
    }

    if (outgoingSynergies.length > 0) {
      highNotes.push(`When kept balanced, it can support ${formatLabelList(outgoingSynergies)}.`);
    }

    return [node.id, {
      summary: nutrientDescriptions[node.id] || `${node.label} participates in the Mulder interaction balance.`,
      low: lowNotes.join(' ') || 'Lower levels mainly reduce its own contribution to the nutrient balance.',
      high: highNotes.join(' ') || 'Higher levels mainly change its own prominence without strong direct chart effects.',
    }];
  }));
}

const initialTuning = {
  synergyFactor: 0.55,
  antagonismFactor: 0.7,
  secondOrderDamping: 0.42,
};

function clampPercentage(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function ElementDetails({
  element,
  guide,
  value,
  onClose,
  onChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
  className = '',
  style,
}) {
  return (
    <div
      className={`element-tooltip ${className}`.trim()}
      role="dialog"
      aria-label={`${element.label} element details`}
      style={style}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="element-tooltip-header">
        <div className="insight-card-header">
          <span className="insight-id" style={{ '--chip': element.color }}>{element.id}</span>
          <div>
            <strong>{element.label}</strong>
            <p className="insight-summary">{guide.summary}</p>
          </div>
        </div>
        <button type="button" className="icon-button" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="insight-metrics">
        <p>Base {Math.round(element.baseValue * 100)}%</p>
        <p>Live value {Math.round(element.displayValue * 100)}%</p>
        <p>Availability {Math.round(element.availabilityScore * 100)}%</p>
      </div>
      <label className="element-tooltip-slider">
        <div className="slider-card-top">
          <span>Adjust level</span>
          <strong>{value}%</strong>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={value}
          onInput={(event) => onChange(Number(event.target.value))}
          onChange={(event) => onChange(Number(event.target.value))}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
        />
      </label>
      <p><span className="insight-label">Low:</span> {guide.low}</p>
      <p><span className="insight-label">High:</span> {guide.high}</p>
    </div>
  );
}

function ChartApp() {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [nutrientValues, setNutrientValues] = useState({});
  const [tuning, setTuning] = useState(initialTuning);
  const [saveState, setSaveState] = useState('Graph file is loaded from the server copy.');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeInteraction, setActiveInteraction] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const sceneOverlayRef = useRef(null);

  useEffect(() => {
    document.title = "Mulder's Chart 3D";
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsRulesOpen(false);
        setSelectedElementId(null);
        setTooltipPosition(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    async function loadGraph() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/graph');
        if (!response.ok) {
          throw new Error('Unable to fetch graph data.');
        }

        const nextGraph = await response.json();
        setGraph(nextGraph);
        setNutrientValues(createDefaultNodeState(nextGraph.nodes));
        setError('');
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadGraph();
  }, []);

  const graphState = calculateGraphState(graph.nodes, graph.edges, nutrientValues, tuning);
  const elementGuide = useMemo(() => createElementGuide(graph.nodes, graph.edges), [graph.nodes, graph.edges]);
  const highlightState = useMemo(() => {
    if (!activeInteraction) {
      return null;
    }

    const edgeHighlights = {};
    const nodeHighlights = {};

    Object.entries(graphState.edgeContributions).forEach(([edgeKey, contribution]) => {
      if (contribution.source !== activeInteraction.nodeId) {
        return;
      }

      if (Math.abs(contribution.totalEffect) < 0.0001) {
        return;
      }

      const sign = contribution.totalEffect >= 0 ? 'positive' : 'negative';
      edgeHighlights[edgeKey] = {
        sign,
        magnitude: Math.abs(contribution.totalEffect),
      };

      nodeHighlights[contribution.target] = {
        sign,
        magnitude: Math.abs(contribution.totalEffect),
      };
    });

    return {
      sourceId: activeInteraction.nodeId,
      startedAt: activeInteraction.startedAt,
      durationMs: 30000,
      edgeHighlights,
      nodeHighlights,
    };
  }, [activeInteraction, graphState.edgeContributions]);

  function handleNutrientChange(nodeId, nextValue) {
    setNutrientValues((current) => ({
      ...current,
      [nodeId]: nextValue,
    }));
    setActiveInteraction({
      nodeId,
      startedAt: Date.now(),
    });
  }

  function handleTuningChange(field, value) {
    setTuning((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateTooltipSlider(nodeId, nextValue) {
    handleNutrientChange(nodeId, clampPercentage(nextValue));
  }

  function handleTooltipSliderPointer(event, nodeId) {
    event.stopPropagation();

    const target = event.currentTarget;
    const pointerId = event.pointerId;

    const updateFromClientX = (clientX) => {
      const rect = target.getBoundingClientRect();
      if (!rect.width) {
        return;
      }

      const ratio = (clientX - rect.left) / rect.width;
      updateTooltipSlider(nodeId, ratio * 100);
    };

    updateFromClientX(event.clientX);
    target.setPointerCapture?.(pointerId);

    const handleMove = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId) {
        return;
      }

      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      updateFromClientX(moveEvent.clientX);
    };

    const handleEnd = (endEvent) => {
      if (endEvent.pointerId !== pointerId) {
        return;
      }

      endEvent.preventDefault();
      endEvent.stopPropagation();
      updateFromClientX(endEvent.clientX);
      target.releasePointerCapture?.(pointerId);
      target.removeEventListener('pointermove', handleMove);
      target.removeEventListener('pointerup', handleEnd);
      target.removeEventListener('pointercancel', handleEnd);
    };

    target.addEventListener('pointermove', handleMove);
    target.addEventListener('pointerup', handleEnd);
    target.addEventListener('pointercancel', handleEnd);
  }

  function handleTooltipSliderKeyDown(event, nodeId) {
    const currentValue = nutrientValues[nodeId] ?? 0;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      updateTooltipSlider(nodeId, currentValue - 1);
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      updateTooltipSlider(nodeId, currentValue + 1);
    }

    if (event.key === 'Home') {
      event.preventDefault();
      updateTooltipSlider(nodeId, 0);
    }

    if (event.key === 'End') {
      event.preventDefault();
      updateTooltipSlider(nodeId, 100);
    }
  }

  function handleReset() {
    setNutrientValues(createDefaultNodeState(graph.nodes));
    setTuning(initialTuning);
    setActiveInteraction(null);
  }

  function handlePersistBase() {
    const nextGraph = createPersistedGraph(graph, nutrientValues);
    setGraph(nextGraph);
    setSaveState('Base values updated locally. Save file to persist the new defaults.');
  }

  async function handleSaveGraph() {
    try {
      setSaveState('Saving graph file...');
      const payload = createPersistedGraph(graph, nutrientValues);
      const response = await fetch('/api/graph', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Save request failed.');
      }

      setGraph(payload);
      setSaveState('Graph file saved to data/mulders-graph.json.');
    } catch (saveError) {
      setSaveState(`Save failed: ${saveError.message}`);
    }
  }

  function handleEdgeChange(nextEdges) {
    setGraph((current) => ({
      ...current,
      edges: nextEdges,
    }));
    setSaveState('Rule table changed locally. Save file to persist changes.');
  }

  function handleOpenRules() {
    setIsMenuOpen(false);
    setIsRulesOpen(true);
  }

  function handleNodeTooltip(nodeId, pointer) {
    const bounds = sceneOverlayRef.current?.getBoundingClientRect();

    if (!bounds) {
      setSelectedElementId(nodeId);
      setTooltipPosition({ x: 24, y: 24 });
      return;
    }

    const tooltipWidth = 340;
    const tooltipHeight = 260;
    const margin = 18;
    const preferredX = pointer.clientX - bounds.left + 18;
    const preferredY = pointer.clientY - bounds.top - 10;
    const maxX = Math.max(margin, bounds.width - tooltipWidth - margin);
    const maxY = Math.max(margin, bounds.height - tooltipHeight - margin);

    setSelectedElementId(nodeId);
    setTooltipPosition({
      x: Math.min(Math.max(preferredX, margin), maxX),
      y: Math.min(Math.max(preferredY, margin), maxY),
    });
  }

  const selectedElement = selectedElementId
    ? graphState.nodes.find((node) => node.id === selectedElementId) || null
    : null;
  const selectedGuide = selectedElement ? elementGuide[selectedElement.id] : null;
  const closeSelectedElement = () => {
    setSelectedElementId(null);
    setTooltipPosition(null);
  };

  if (isLoading) {
    return <div className="status-screen">Loading graph data...</div>;
  }

  if (error) {
    return <div className="status-screen">{error}</div>;
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Nutrient Simulation</p>
          <h1>Mulder&apos;s Chart in live 3D</h1>
          <p className="hero-copy">
            Adjust nutrient amounts, watch antagonistic suppression and synergistic support propagate through the network,
            and edit the interaction matrix that is saved back to the server-side data file.
          </p>
        </div>
        <div className="formula-card">
          <div className="formula-header">
            <span>Availability model</span>
            <div className="menu-shell">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setIsMenuOpen((current) => !current)}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
              >
                Menu
              </button>
              {isMenuOpen ? (
                <div className="menu-panel" role="menu">
                  <button type="button" className="menu-item" role="menuitem" onClick={handleOpenRules}>
                    Open interaction table
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <strong>availability = clamp(base + synergy - antagonism, 0, 1)</strong>
          <small>First-order reactions apply immediately. Second-order effects re-enter the graph with damping.</small>
        </div>
      </header>

      <section className="dashboard-grid">
        <ControlPanel
          nodes={graphState.nodes}
          nutrientValues={nutrientValues}
          tuning={tuning}
          onNutrientChange={handleNutrientChange}
          onTuningChange={handleTuningChange}
          onReset={handleReset}
          onPersistBase={handlePersistBase}
        />
        <div className="scene-column">
          <GraphScene
            graphState={graphState}
            highlightState={highlightState}
            onNodeSelect={handleNodeTooltip}
            controlsEnabled={!selectedElement}
          >
            <div
              className={`scene-overlay${selectedElement && selectedGuide && tooltipPosition ? ' scene-overlay-active' : ''}`}
              ref={sceneOverlayRef}
              onClick={closeSelectedElement}
            >
              {selectedElement && selectedGuide && tooltipPosition ? (
                <ElementDetails
                  element={selectedElement}
                  guide={selectedGuide}
                  value={nutrientValues[selectedElement.id]}
                  className="element-tooltip-floating element-tooltip-desktop"
                  style={{ left: `${tooltipPosition.x}px`, top: `${tooltipPosition.y}px` }}
                  onClose={closeSelectedElement}
                  onChange={(nextValue) => onNutrientChange(selectedElement.id, nextValue)}
                  onPointerDown={(event) => handleTooltipSliderPointer(event, selectedElement.id)}
                  onPointerMove={(event) => event.stopPropagation()}
                  onPointerUp={(event) => event.stopPropagation()}
                  onKeyDown={(event) => handleTooltipSliderKeyDown(event, selectedElement.id)}
                />
              ) : null}
            </div>
          </GraphScene>

          {selectedElement && selectedGuide ? (
            <ElementDetails
              element={selectedElement}
              guide={selectedGuide}
              value={nutrientValues[selectedElement.id]}
              className="element-tooltip-mobile"
              onClose={closeSelectedElement}
              onChange={(nextValue) => onNutrientChange(selectedElement.id, nextValue)}
              onPointerDown={(event) => handleTooltipSliderPointer(event, selectedElement.id)}
              onPointerMove={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onKeyDown={(event) => handleTooltipSliderKeyDown(event, selectedElement.id)}
            />
          ) : null}
        </div>
      </section>

      <section className="insight-section">
        <div className="insight-section-header">
          <div>
            <p className="eyebrow">Element Guide</p>
            <h2>What low and high levels mean in this chart</h2>
          </div>
          <p className="insight-section-copy">
            These notes follow the Mulder interactions modeled above, so each card explains both the nutrient itself and how it behaves when levels drift low or high.
          </p>
        </div>

        <div className="insight-strip">
          {graphState.nodes.map((node) => {
            const guide = elementGuide[node.id];

            return (
              <article className="insight-card" key={node.id}>
                <div className="insight-card-header">
                  <span className="insight-id" style={{ '--chip': node.color }}>{node.id}</span>
                  <div>
                    <strong>{node.label}</strong>
                    <p className="insight-summary">{guide.summary}</p>
                  </div>
                </div>
                <div className="insight-metrics">
                  <p>Base {Math.round(node.baseValue * 100)}%</p>
                  <p>Availability {Math.round(node.availabilityScore * 100)}%</p>
                </div>
                <p className="insight-card-hint">Click the chart node for low/high interpretation</p>
              </article>
            );
          })}
        </div>
      </section>

      {isRulesOpen ? (
        <div className="modal-backdrop" onClick={() => setIsRulesOpen(false)}>
          <div
            className="modal-shell"
            role="dialog"
            aria-modal="true"
            aria-label="Editable Mulder rules"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Interaction Table</p>
                <h2>Editable Mulder rules</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setIsRulesOpen(false)}>
                Close
              </button>
            </div>
            <RelationshipEditor
              edges={graph.edges}
              onChange={handleEdgeChange}
              onSave={handleSaveGraph}
              saveState={saveState}
              className="relationship-editor-modal"
            />
          </div>
        </div>
      ) : null}

      <footer className="site-footer">
        <span>Copyright agriwater.earth. Patent pending.</span>
        <span className="build-badge" aria-label={`Build ${buildLabel}`}>
          {buildLabel}
        </span>
        <a className="footer-link" href="/legal/terms">
          Terms and Conditions
        </a>
      </footer>
    </main>
  );
}

export default function App() {
  const pathname = typeof window === 'undefined'
    ? '/'
    : window.location.pathname.replace(/\/$/, '') || '/';

  if (pathname === '/legal/terms') {
    return <TermsPage />;
  }

  return <ChartApp />;
}