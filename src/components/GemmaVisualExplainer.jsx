import React, { useState, useEffect } from 'react';
import { analyzeDiagramWithGemma4 } from '../services/gemmaService';

export default function GemmaVisualExplainer({ isOpen, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDocTitle, setSelectedDocTitle] = useState('');
  const [diagramType, setDiagramType] = useState('concept');
  const [customPrompt, setCustomPrompt] = useState('State the 3 laws of entropy');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      let loadedDocs = [];
      try {
        const stored = JSON.parse(localStorage.getItem('documents'));
        if (Array.isArray(stored) && stored.length > 0) loadedDocs = stored;
      } catch (e) {}

      if (loadedDocs.length === 0) {
        loadedDocs = [
          { id: '1', title: 'Entropy, Microstates & The Second Law of Thermodynamics', extractedText: 'Entropy is a measure of disorder...' },
          { id: '2', title: 'Constitutional Foundations: Article 21 & Due Process in India', extractedText: 'Article 21 guarantees protection of life and personal liberty...' },
          { id: '3', title: 'Dynamic Programming & Optimal Substructure in Graph Shortest Paths', extractedText: 'Dijkstra algorithm uses a priority queue...' }
        ];
      }
      
      setDocuments(loadedDocs);
      if (loadedDocs.length > 0) setSelectedDocTitle(loadedDocs[0].title);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!selectedDocTitle) return;
    setLoading(true);
    setResult(null);
    
    const selectedDoc = documents.find(d => d.title === selectedDocTitle);
    const docContent = selectedDoc?.extractedText || selectedDoc?.content || selectedDoc?.text || '';

    try {
      const res = await analyzeDiagramWithGemma4({
        documentTitle: selectedDocTitle,
        documentContent: docContent,
        customQuery: customPrompt,
        diagramType: diagramType
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999, padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff', borderRadius: '16px', width: '100%',
        maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>⚡ Visual Planner</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Generate custom concept maps and flowcharts from your library documents.</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#e2e8f0', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>1. Select Source Document</label>
            <select
              value={selectedDocTitle}
              onChange={(e) => setSelectedDocTitle(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              {documents.map((doc, idx) => (
                <option key={idx} value={doc.title}>📄 {doc.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>2. Output Format</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setDiagramType('concept')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                  border: diagramType === 'concept' ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                  background: diagramType === 'concept' ? '#eef2ff' : '#fff', color: diagramType === 'concept' ? '#4338ca' : '#475569'
                }}
              >📊 Concept Map</button>
              <button
                onClick={() => setDiagramType('flowchart')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                  border: diagramType === 'flowchart' ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                  background: diagramType === 'flowchart' ? '#eef2ff' : '#fff', color: diagramType === 'flowchart' ? '#4338ca' : '#475569'
                }}
              >🔀 Decision Flowchart</button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>3. Custom Query</label>
            <textarea
              rows={2}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., State the 3 laws of entropy..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !selectedDocTitle}
            style={{
              padding: '12px', borderRadius: '8px', border: 'none',
              background: loading ? '#94a3b8' : '#4f46e5', color: '#fff',
              fontSize: '0.9rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? '🧠 Generating Diagram...' : '🚀 Generate Visual Structure'}
          </button>

          {result && (
            <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>Visual Planner Engine</span>
              <pre style={{ margin: '10px 0 0 0', whiteSpace: 'pre-wrap', fontSize: '0.85rem', fontFamily: 'monospace', color: '#1e293b', lineHeight: '1.5' }}>
                {result.text}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
