import React, { useRef } from 'react';
import { Download } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

export interface MindMapData {
  theme?: string;
  sujet?: string;
  problematique?: string;
  plan?: { type: string; arguments: string[] }[];
}

interface MindMapProps {
  data: MindMapData;
}

export default function MindMap({ data }: MindMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!mapRef.current) return;
    try {
      const el = mapRef.current;
      const dataUrl = await htmlToImage.toPng(el, {
        backgroundColor: '#0f1117',
        width: el.scrollWidth + 40, // 20px padding on each side
        height: el.scrollHeight + 40, // 20px padding top and bottom
        style: {
          padding: '20px',
          margin: '0'
        }
      });
      const link = document.createElement('a');
      link.download = 'carte-mentale.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download mind map', err);
    }
  };

  if (!data.theme && !data.sujet && !data.problematique && (!data.plan || data.plan.length === 0)) {
    return (
      <div className="mindmap-container glass-panel">
        <div className="mindmap-empty">
          <p>La carte mentale se construira ici au fur et à mesure de vos validations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mindmap-container glass-panel">
      <div className="mindmap-header">
        <h3>Carte Mentale</h3>
        <button className="btn btn-secondary btn-small" onClick={handleDownload} title="Télécharger en PNG">
          <Download size={16} />
        </button>
      </div>

      <div className="mindmap-content">
        <div className="mm-tree" ref={mapRef}>
          {data.theme && (
            <div className="mm-node mm-theme">
              <span className="mm-label">Thème</span>
              <p>{data.theme}</p>
            </div>
          )}

          {data.sujet && (
            <>
              <div className="mm-line"></div>
              <div className="mm-node mm-sujet">
                <span className="mm-label">Sujet</span>
                <p>{data.sujet}</p>
              </div>
            </>
          )}

          {data.problematique && (
            <>
              <div className="mm-line"></div>
              <div className="mm-node mm-problematique">
                <span className="mm-label">Problématique</span>
                <p>{data.problematique}</p>
              </div>
            </>
          )}

          {data.plan && data.plan.length > 0 && (
            <>
              <div className="mm-line"></div>
              <div className="mm-branches">
                {data.plan.map((part, i) => (
                  <div key={i} className="mm-branch">
                    <div className="mm-node mm-plan-type">
                      <p>{part.type}</p>
                    </div>
                    {part.arguments && part.arguments.length > 0 && (
                      <div className="mm-arguments">
                        <div className="mm-line-vertical"></div>
                        {part.arguments.map((arg, j) => (
                          <div key={j} className="mm-node mm-argument">
                            <p>{arg}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
