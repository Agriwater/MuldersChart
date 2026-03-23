import { useEffect, useMemo, useState } from 'react';
import GraphScene from './components/GraphScene';
import ControlPanel from './components/ControlPanel';
import RelationshipEditor from './components/RelationshipEditor';
import { calculateGraphState, createDefaultNodeState, createPersistedGraph } from './lib/graphMath';

const initialTuning = {
  synergyFactor: 0.55,
  antagonismFactor: 0.7,
  secondOrderDamping: 0.42,
};

export default function App() {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [nutrientValues, setNutrientValues] = useState({});
  const [tuning, setTuning] = useState(initialTuning);
  const [saveState, setSaveState] = useState('Graph file is loaded from the server copy.');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeInteraction, setActiveInteraction] = useState(null);

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
          <p className="eyebrow">Three.js Nutrient Simulation</p>
          <h1>Mulder&apos;s Chart in live 3D</h1>
          <p className="hero-copy">
            Adjust nutrient amounts, watch antagonistic suppression and synergistic support propagate through the network,
            and edit the interaction matrix that is saved back to the server-side data file.
          </p>
        </div>
        <div className="formula-card">
          <span>Availability model</span>
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
        <GraphScene graphState={graphState} highlightState={highlightState} />
      </section>

      <section className="insight-strip">
        {graphState.nodes.map((node) => (
          <article className="insight-card" key={node.id}>
            <span className="insight-id" style={{ '--chip': node.color }}>{node.id}</span>
            <strong>{node.label}</strong>
            <p>Base {Math.round(node.baseValue * 100)}%</p>
            <p>Live value {Math.round(node.displayValue * 100)}%</p>
            <p>Availability {Math.round(node.availabilityScore * 100)}%</p>
          </article>
        ))}
      </section>

      <RelationshipEditor
        edges={graph.edges}
        onChange={handleEdgeChange}
        onSave={handleSaveGraph}
        saveState={saveState}
      />
    </main>
  );
}