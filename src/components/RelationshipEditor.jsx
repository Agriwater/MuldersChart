const nutrientOptions = ['N', 'P', 'K', 'Ca', 'Mg', 'S', 'Fe', 'Zn', 'Mn', 'Cu', 'B', 'Mo'];

function createEmptyEdge() {
  return {
    source: 'N',
    target: 'S',
    relationshipType: 'synergistic',
    weight: 0.4,
    animationStyle: 'pulse',
    ruleDescription: 'Describe the interaction',
  };
}

export default function RelationshipEditor({ edges, onChange, onSave, saveState, className = '' }) {
  function updateEdge(index, field, value) {
    const nextEdges = edges.map((edge, edgeIndex) => {
      if (edgeIndex !== index) {
        return edge;
      }

      return {
        ...edge,
        [field]: field === 'weight' ? Number(value) : value,
      };
    });

    onChange(nextEdges);
  }

  function removeEdge(index) {
    onChange(edges.filter((_, edgeIndex) => edgeIndex !== index));
  }

  function addEdge() {
    onChange([...edges, createEmptyEdge()]);
  }

  return (
    <section className={`panel panel-table relationship-editor ${className}`.trim()}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Interaction Table</p>
          <h2>Editable Mulder rules</h2>
        </div>
        <div className="button-row">
          <button type="button" className="ghost-button" onClick={addEdge}>Add rule</button>
          <button type="button" className="solid-button" onClick={onSave}>Save file</button>
        </div>
      </div>

      <div className="save-state">{saveState}</div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Target</th>
              <th>Relationship</th>
              <th>Weight</th>
              <th>Rule</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {edges.map((edge, index) => (
              <tr key={`${edge.source}-${edge.target}-${index}`}>
                <td>
                  <select value={edge.source} onChange={(event) => updateEdge(index, 'source', event.target.value)}>
                    {nutrientOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </td>
                <td>
                  <select value={edge.target} onChange={(event) => updateEdge(index, 'target', event.target.value)}>
                    {nutrientOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </td>
                <td>
                  <select value={edge.relationshipType} onChange={(event) => updateEdge(index, 'relationshipType', event.target.value)}>
                    <option value="antagonistic">antagonistic</option>
                    <option value="synergistic">synergistic</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={edge.weight}
                    onChange={(event) => updateEdge(index, 'weight', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={edge.ruleDescription ?? ''}
                    onChange={(event) => updateEdge(index, 'ruleDescription', event.target.value)}
                  />
                </td>
                <td>
                  <button type="button" className="icon-button" onClick={() => removeEdge(index)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}