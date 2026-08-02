import React from 'react';






import { useState } from 'react';

const HearingTimeline = ({ hearings, user, onUpdateHearing }) => {
  const [editingId, setEditingId] = useState(null);
  const [editPurpose, setEditPurpose] = useState('');
  const [editOutcomeNotes, setEditOutcomeNotes] = useState('');
  const [editNextDate, setEditNextDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (hearings.length === 0) {
    return (
      <div className="empty-state">
        <p>No hearings recorded for this case.</p>
      </div>
    );
  }

  const handleEditClick = (h) => {
    setEditingId(h.id);
    setEditPurpose(h.purpose);
    setEditOutcomeNotes(h.outcome_notes || '');
    setEditNextDate(h.next_hearing_date || '');
  };

  const handleSave = async (h) => {
    setSubmitting(true);
    await onUpdateHearing(h.id, {
      purpose: editPurpose,
      outcome_notes: editOutcomeNotes,
      next_hearing_date: editNextDate || null
    });
    setEditingId(null);
    setSubmitting(false);
  };

  return (
    <div className="timeline">
      {hearings.map((h, index) =>
      <div key={h.id} className="timeline-item">
          <span className="timeline-marker">{index + 1}</span>
          
          {editingId === h.id ? (
            <div style={{ width: '100%', paddingBottom: '0.5rem' }}>
              <input className="form-control mb-1" style={{ fontSize: '0.8rem', padding: '0.25rem' }} value={editPurpose} onChange={e => setEditPurpose(e.target.value)} placeholder="Purpose" />
              <textarea className="form-control mb-1" style={{ fontSize: '0.8rem', padding: '0.25rem' }} value={editOutcomeNotes} onChange={e => setEditOutcomeNotes(e.target.value)} placeholder="Outcome Notes" rows={2} />
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next Date:</span>
                <input type="date" className="form-control" style={{ fontSize: '0.8rem', padding: '0.25rem' }} value={editNextDate} onChange={e => setEditNextDate(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => handleSave(h)} disabled={submitting}>{submitting ? '...' : 'Save'}</button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="timeline-purpose">{h.purpose}</span>
                  {user?.role === 'judge' && (
                    <button className="btn-link" style={{ fontSize: '0.7rem', padding: 0 }} onClick={() => handleEditClick(h)}>Edit</button>
                  )}
                </div>
                <span className="timeline-date">{h.hearing_date}</span>
              </div>
              {h.outcome_notes &&
            <p className="timeline-outcome">{h.outcome_notes}</p>
            }
              {h.next_hearing_date &&
            <p className="timeline-date" style={{ marginTop: '0.3rem' }}>
                  Next hearing: {h.next_hearing_date}
                </p>
            }
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HearingTimeline;