import React from 'react';
import type { Hearing } from '../types';

interface HearingTimelineProps {
  hearings: Hearing[];
}

const HearingTimeline: React.FC<HearingTimelineProps> = ({ hearings }) => {
  if (hearings.length === 0) {
    return (
      <div className="empty-state">
        <p>No hearings recorded for this case.</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      {hearings.map((h, index) => (
        <div key={h.id} className="timeline-item">
          <span className="timeline-marker">{index + 1}</span>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
              <span className="timeline-purpose">{h.purpose}</span>
              <span className="timeline-date">{h.hearing_date}</span>
            </div>
            {h.outcome_notes && (
              <p className="timeline-outcome">{h.outcome_notes}</p>
            )}
            {h.next_hearing_date && (
              <p className="timeline-date" style={{ marginTop: '0.3rem' }}>
                Next hearing: {h.next_hearing_date}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HearingTimeline;
