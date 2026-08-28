import React, { useState } from 'react';
import { i18n } from '../../services/i18n.js';
import { storageService } from '../../services/storage.js';

export function NotesView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNote, setActiveNote] = useState(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tick, setTick] = useState(0);

  const notes = storageService.getNotes();

  const filteredNotes = notes.filter(n => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (n.title && n.title.toLowerCase().includes(q)) ||
           (n.content && n.content.toLowerCase().includes(q));
  });

  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const otherNotes = filteredNotes.filter(n => !n.is_pinned);

  const handleOpenEditor = (note = null) => {
    if (note) {
      setActiveNote(note);
      setEditorTitle(note.title || '');
      setEditorContent(note.content || '');
    } else {
      setActiveNote(null);
      setEditorTitle('');
      setEditorContent('');
    }
    setIsEditing(true);
  };

  const handleSaveNote = () => {
    if (activeNote) {
      storageService.updateNote(activeNote.id, {
        title: editorTitle,
        content: editorContent
      });
    } else {
      storageService.createNote(editorTitle, editorContent);
    }
    setIsEditing(false);
    setTick(t => t + 1);
  };

  const handleDeleteNote = (noteId) => {
    storageService.deleteNote(noteId);
    setIsEditing(false);
    setTick(t => t + 1);
  };

  const handleTogglePin = (note, e) => {
    e.stopPropagation();
    storageService.updateNote(note.id, { is_pinned: !note.is_pinned });
    setTick(t => t + 1);
  };

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div class="tasks-search-wrap" style={{ maxWidth: '380px' }}>
          <span class="material-symbols-rounded tasks-search-icon">search</span>
          <input
            type="text"
            class="tasks-search-input"
            placeholder={i18n.t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button class="m3-btn-primary" onClick={() => handleOpenEditor(null)}>
          <span class="material-symbols-rounded" style={{ fontSize: '20px', verticalAlign: 'middle' }}>add</span>
          <span>{i18n.t('new_note')}</span>
        </button>
      </div>

      {pinnedNotes.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--m3-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span class="material-symbols-rounded" style={{ fontSize: '18px' }}>push_pin</span>
            {i18n.t('pinned_notes')}
          </h3>
          <div class="notes-grid">
            {pinnedNotes.map(n => (
              <div key={n.id} class="note-card pinned" onClick={() => handleOpenEditor(n)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div class="note-card-title">{n.title || i18n.t('new_note')}</div>
                  <button
                    onClick={(e) => handleTogglePin(n, e)}
                    style={{ background: 'none', border: 'none', color: 'var(--m3-primary)', cursor: 'pointer' }}
                  >
                    <span class="material-symbols-rounded" style={{ fontSize: '20px' }}>push_pin</span>
                  </button>
                </div>
                <div class="note-card-preview">{stripHtml(n.content)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        {pinnedNotes.length > 0 && (
          <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--m3-text-secondary)' }}>
            {i18n.t('other_notes')}
          </h3>
        )}

        {otherNotes.length === 0 && pinnedNotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--m3-text-muted)' }}>
            <span class="material-symbols-rounded" style={{ fontSize: '48px', opacity: 0.5 }}>sticky_note_2</span>
            <p style={{ marginTop: '0.5rem', fontWeight: '700' }}>{i18n.t('no_notes')}</p>
          </div>
        ) : (
          <div class="notes-grid">
            {otherNotes.map(n => (
              <div key={n.id} class="note-card" onClick={() => handleOpenEditor(n)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div class="note-card-title">{n.title || i18n.t('new_note')}</div>
                  <button
                    onClick={(e) => handleTogglePin(n, e)}
                    style={{ background: 'none', border: 'none', color: 'var(--m3-text-muted)', cursor: 'pointer' }}
                  >
                    <span class="material-symbols-rounded" style={{ fontSize: '20px' }}>push_pin</span>
                  </button>
                </div>
                <div class="note-card-preview">{stripHtml(n.content)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isEditing && (
        <div class="m3-modal-backdrop" onClick={() => setIsEditing(false)}>
          <div class="m3-modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h2 class="modal-title">{activeNote ? i18n.t('edit') : i18n.t('new_note')}</h2>
              <button class="m3-action-btn" onClick={() => setIsEditing(false)}>
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>

            <div class="note-editor-modal">
              <input
                type="text"
                class="m3-input"
                style={{ fontSize: '1.2rem', fontWeight: '800' }}
                placeholder={i18n.t('task_title')}
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                autoFocus
              />

              <div class="note-toolbar">
                <button type="button" class="note-toolbar-btn" onClick={() => applyFormat('formatBlock', '<h1>')}>
                  <strong>H1</strong>
                </button>
                <button type="button" class="note-toolbar-btn" onClick={() => applyFormat('formatBlock', '<h2>')}>
                  <strong>H2</strong>
                </button>
                <button type="button" class="note-toolbar-btn" onClick={() => applyFormat('bold')}>
                  <strong>B</strong>
                </button>
                <button type="button" class="note-toolbar-btn" onClick={() => applyFormat('italic')}>
                  <em>I</em>
                </button>
                <button type="button" class="note-toolbar-btn" onClick={() => applyFormat('insertUnorderedList')}>
                  <span class="material-symbols-rounded" style={{ fontSize: '16px', verticalAlign: 'middle' }}>format_list_bulleted</span>
                </button>
              </div>

              <div
                class="note-editor-content"
                contentEditable
                dangerouslySetInnerHTML={{ __html: editorContent }}
                onInput={(e) => setEditorContent(e.currentTarget.innerHTML)}
              />

              <div class="modal-actions-row">
                {activeNote && (
                  <button
                    type="button"
                    class="m3-btn-danger"
                    style={{ marginInlineEnd: 'auto' }}
                    onClick={() => handleDeleteNote(activeNote.id)}
                  >
                    {i18n.t('delete')}
                  </button>
                )}
                <button type="button" class="m3-btn-secondary" onClick={() => setIsEditing(false)}>
                  {i18n.t('cancel')}
                </button>
                <button type="button" class="m3-btn-primary" onClick={handleSaveNote}>
                  {i18n.t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
