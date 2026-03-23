const groupLabels = {
  macro: 'Macro',
  secondary: 'Secondary',
  micro: 'Micro',
};

export default function ControlPanel({
  nodes,
  nutrientValues,
  tuning,
  onNutrientChange,
  onTuningChange,
  onReset,
  onPersistBase,
}) {
  const groups = Object.keys(groupLabels);

  return (
    <section className="panel panel-controls">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Nutrient Input</p>
          <h2>Live nutrient levels</h2>
        </div>
        <div className="button-row">
          <button type="button" className="ghost-button" onClick={onReset}>Reset</button>
          <button type="button" className="solid-button" onClick={onPersistBase}>Persist sliders as base</button>
        </div>
      </div>

      <div className="tuning-grid">
        <label>
          <span>Synergy factor</span>
          <input
            type="range"
            min="0"
            max="1.2"
            step="0.01"
            value={tuning.synergyFactor}
            onChange={(event) => onTuningChange('synergyFactor', Number(event.target.value))}
          />
          <strong>{tuning.synergyFactor.toFixed(2)}</strong>
        </label>
        <label>
          <span>Antagonism factor</span>
          <input
            type="range"
            min="0"
            max="1.2"
            step="0.01"
            value={tuning.antagonismFactor}
            onChange={(event) => onTuningChange('antagonismFactor', Number(event.target.value))}
          />
          <strong>{tuning.antagonismFactor.toFixed(2)}</strong>
        </label>
        <label>
          <span>Second-order damping</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={tuning.secondOrderDamping}
            onChange={(event) => onTuningChange('secondOrderDamping', Number(event.target.value))}
          />
          <strong>{tuning.secondOrderDamping.toFixed(2)}</strong>
        </label>
      </div>

      {groups.map((group) => {
        const groupNodes = nodes.filter((node) => node.group === group);

        return (
          <div className="slider-group" key={group}>
            <div className="slider-group-header">
              <h3>{groupLabels[group]}</h3>
              <span>{groupNodes.length} nutrients</span>
            </div>
            {groupNodes.map((node) => (
              <label className="slider-card" key={node.id}>
                <div className="slider-card-top">
                  <span className="node-chip" style={{ '--chip': node.color }}>{node.id}</span>
                  <div>
                    <strong>{node.label}</strong>
                    <p>Availability {Math.round(node.availabilityScore * 100)}%</p>
                  </div>
                  <strong>{nutrientValues[node.id]}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={nutrientValues[node.id]}
                  onChange={(event) => onNutrientChange(node.id, Number(event.target.value))}
                />
              </label>
            ))}
          </div>
        );
      })}
    </section>
  );
}