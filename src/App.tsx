import { useState, useMemo } from 'react';
import { Mafs, Coordinates, Polygon, Line, Text, Theme } from 'mafs';
import 'mafs/core.css';
import 'mafs/font.css';
import solver from 'javascript-lp-solver';
import { computeFeasibleRegion, computeLineSegment } from './geometry';
import type { Constraint, OpType } from './geometry';

export default function App() {
  const [objectiveX, setObjectiveX] = useState(3);
  const [objectiveY, setObjectiveY] = useState(5);
  const [optimization, setOptimization] = useState<'max' | 'min'>('max');
  
  const [constraints, setConstraints] = useState<Constraint[]>([
    { id: '1', a: 1, b: 2, op: '<=', c: 10 },
    { id: '2', a: 3, b: 1, op: '<=', c: 15 },
  ]);

  const addConstraint = () => {
    setConstraints([
      ...constraints,
      { id: Date.now().toString(), a: 1, b: 1, op: '<=', c: 10 }
    ]);
  };

  const updateConstraint = (id: string, field: keyof Constraint, value: any) => {
    setConstraints(constraints.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const removeConstraint = (id: string) => {
    setConstraints(constraints.filter(c => c.id !== id));
  };

  const model = useMemo(() => {
    const m = {
      optimize: 'opt',
      opType: optimization,
      constraints: {} as Record<string, any>,
      variables: {
        x: { opt: objectiveX } as Record<string, number>,
        y: { opt: objectiveY } as Record<string, number>
      }
    };
    
    constraints.forEach((c) => {
      if (c.op === '<=') { m.constraints[c.id] = { max: c.c }; }
      else if (c.op === '>=') { m.constraints[c.id] = { min: c.c }; }
      else if (c.op === '=') { m.constraints[c.id] = { equal: c.c }; }
      
      m.variables.x[c.id] = c.a;
      m.variables.y[c.id] = c.b;
    });

    return m;
  }, [objectiveX, objectiveY, optimization, constraints]);

  const solution = useMemo<any>(() => solver.Solve(model), [model]);
  const polygonVertices = useMemo(() => computeFeasibleRegion(constraints, 100, 100), [constraints]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '20px', gap: '20px', fontFamily: 'sans-serif' }}>
      <h1>Interactive Linear Programming Solver</h1>
     <button
        type="button"
        onClick={() => {
          window.location.href = "https://odd-ivory-gmlgyhrm.edgeone.app/";
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
      >
        Volver
      </button>
      <p>Graphical Method</p>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '350px', border: '1px solid #ccc', padding: '20px' }}>
          <h2>Problem Setup</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label>Optimize: </label>
            <select value={optimization} onChange={(e) => setOptimization(e.target.value as 'max'|'min')}>
              <option value="max">Maximize</option>
              <option value="min">Minimize</option>
            </select>
          </div>
          <div style={{ marginTop: '15px' }}>
            <label >Z = </label>
            <input type="number" step="any" value={objectiveX} onChange={e => setObjectiveX(Number(e.target.value))} style={{ width: '60px' }} /> x + 
            <input type="number" step="any" value={objectiveY} onChange={e => setObjectiveY(Number(e.target.value))} style={{ width: '60px', marginLeft: '5px' }} /> y
          </div>
          
          <h3 style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
            Constraints
            <button onClick={addConstraint} style={{ padding: '4px 8px', cursor: 'pointer' }}>+ Add</button>
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {constraints.map((c) => (
              <li key={c.id} style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '10px' }}>
                <input type="number" step="any" value={c.a} onChange={e => updateConstraint(c.id, 'a', Number(e.target.value))} style={{ width: '60px' }} /> x +
                <input type="number" step="any" value={c.b} onChange={e => updateConstraint(c.id, 'b', Number(e.target.value))} style={{ width: '60px' }} /> y
                <select value={c.op} onChange={e => updateConstraint(c.id, 'op', e.target.value as OpType)}>
                  <option value="<=">&le;</option>
                  <option value=">=">&ge;</option>
                  <option value="=">=</option>
                </select>
                <input type="number" step="any" value={c.c} onChange={e => updateConstraint(c.id, 'c', Number(e.target.value))} style={{ width: '60px' }} />
                <button onClick={() => removeConstraint(c.id)} style={{ color: 'red', cursor: 'pointer' }}>&times;</button>
              </li>
            ))}
            <li style={{ marginTop: '10px', fontStyle: 'italic', color: '#666' }}>x &ge; 0, y &ge; 0 (Implicit Non-negativity)</li>
          </ul>

          <h2 style={{ marginTop: '30px' }}>Solution</h2>
          <div style={{ padding: '15px', backgroundColor: solution?.feasible ? '#e8f5e9' : '#ffebee', border: '1px solid #ccc' }}>
            <p style={{ margin: '0 0 10px 0' }}>
              <strong>Status:</strong> {solution?.feasible ? 'Feasible / Optimal Found' : 'Infeasible or Unbounded'}
            </p>
            {solution?.feasible && (
              <>
                <p style={{ margin: '5px 0' }}><strong>Optimal Value (Z):</strong> {solution.result}</p>
                <p style={{ margin: '5px 0' }}><strong>x:</strong> {solution.x || 0}</p>
                <p style={{ margin: '5px 0' }}><strong>y:</strong> {solution.y || 0}</p>
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 2, height: '600px', minWidth: '400px' }}>
          <Mafs viewBox={{ x: [-2, 20], y: [-2, 20] }}>
            <Coordinates.Cartesian />
            
            {polygonVertices.length >= 3 && (
              <Polygon points={polygonVertices} color={Theme.blue} weight={2} />
            )}

            {constraints.map((c) => {
              const seg = computeLineSegment(c, [-50, 100], [-50, 100]);
              if (!seg) return null;
              return (
                <Line.Segment 
                  key={c.id} 
                  point1={seg[0]} 
                  point2={seg[1]} 
                  color={Theme.red} 
                  style="dashed" 
                />
              );
            })}

            {solution?.feasible && (objectiveX !== 0 || objectiveY !== 0) && (
              // Objective function level curve passing through the optimal point
              <Line.Segment 
                point1={objectiveY !== 0 ? [-50, (solution.result - objectiveX * -50) / objectiveY] : [solution.result / objectiveX, -50]}
                point2={objectiveY !== 0 ? [50, (solution.result - objectiveX * 50) / objectiveY] : [solution.result / objectiveX, 50]}
                color={Theme.green} 
                weight={3}
              />
            )}
            
            {solution?.feasible && (
              <Text x={solution.x || 0} y={solution.y || 0} attach="nw" color={Theme.green} >
                Z*({solution.x || 0}, {solution.y || 0}) = {solution.result}
              </Text>
            )}

          </Mafs>
        </div>
      </div>
    </div>
  );
}
