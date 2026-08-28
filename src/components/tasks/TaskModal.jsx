import React, { useState } from 'react';
import { i18n } from '../../services/i18n.js';
import { TASK_PRIORITY } from '../../domain/taskRules.js';
import { RECURRENCE_FREQ, RECURRENCE_END } from '../../domain/recurrenceEngine.js';

export function TaskModal({ task, lists, tags, isPremium, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [listId, setListId] = useState(task?.list_id || '');
  const [priority, setPriority] = useState(task?.priority || TASK_PRIORITY.NONE);
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [dueTime, setDueTime] = useState(task?.due_time || '');
  const [subtasks, setSubtasks] = useState(task?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState(task?.tags || []);
  const [reminders, setReminders] = useState(task?.reminders && task.reminders.length > 0 ? task.reminders : ['at_time']);
  const [recurrenceFreq, setRecurrenceFreq] = useState(task?.recurrence?.frequency || 'none');
  const [recurrenceEnd, setRecurrenceEnd] = useState(task?.recurrence?.end_type || 'never');
  const [recurrenceCount, setRecurrenceCount] = useState(task?.recurrence?.end_count || 5);
  const [errorMsg, setErrorMsg] = useState('');

  const maxSubtasks = isPremium ? 199 : 19;
  const maxReminders = isPremium ? 5 : 2;

  const setQuickDate = (type) => {
    const d = new Date();
    if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    } else if (type === 'next_week') {
      d.setDate(d.getDate() + 7);
      d.setHours(9, 0, 0, 0);
    } else {
      d.setHours(d.getHours() + 1, 0, 0, 0);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');

    setDueDate(`${yyyy}-${mm}-${dd}`);
    setDueTime(`${hh}:${min}`);
    if (!reminders.includes('at_time')) {
      setReminders([...reminders, 'at_time']);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    if (subtasks.length >= maxSubtasks) {
      setErrorMsg(i18n.t('limit_subtasks_reached'));
      return;
    }
    setSubtasks([
      ...subtasks,
      { id: `sub_${Date.now()}`, title: newSubtaskTitle.trim(), is_completed: false, position: subtasks.length }
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleToggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleToggleReminder = (remType) => {
    if (reminders.includes(remType)) {
      setReminders(reminders.filter(r => r !== remType));
    } else {
      if (reminders.length >= maxReminders) {
        setErrorMsg(i18n.t('limit_reminders_reached'));
        return;
      }
      setReminders([...reminders, remType]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg(i18n.t('task_title'));
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      list_id: listId || null,
      priority,
      due_date: dueDate || null,
      due_time: dueTime || (dueDate ? '09:00' : null),
      subtasks,
      tags: selectedTags,
      reminders: (reminders && reminders.length > 0) ? reminders : (dueDate ? ['at_time'] : []),
      recurrence: recurrenceFreq !== 'none' ? {
        frequency: recurrenceFreq,
        interval: 1,
        end_type: recurrenceEnd,
        end_count: Number(recurrenceCount),
        timezone: 'Africa/Cairo'
      } : null
    };

    onSave(payload);
  };

  return (
    <div class="m3-modal-backdrop" onClick={onClose}>
      <div class="m3-modal-card" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2 class="modal-title">{task ? i18n.t('edit') : i18n.t('new_task')}</h2>
          <button class="m3-action-btn" onClick={onClose}>
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: 'var(--m3-error-container)', color: 'var(--m3-error)', padding: '0.6rem 1rem', borderRadius: '12px', fontWeight: 'bold' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} class="modal-body">
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.3rem', display: 'block' }}>
              {i18n.t('task_title')} *
            </label>
            <input
              type="text"
              class="m3-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={i18n.t('task_title')}
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.3rem', display: 'block' }}>
              {i18n.t('task_desc')}
            </label>
            <textarea
              class="m3-input"
              style={{ minHeight: '70px', resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={i18n.t('task_desc')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.3rem', display: 'block' }}>
                {i18n.t('my_lists')}
              </label>
              <select
                class="m3-input"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
              >
                <option value="">{i18n.t('inbox')}</option>
                {lists.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.3rem', display: 'block' }}>
                {i18n.t('priority')}
              </label>
              <select
                class="m3-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value={TASK_PRIORITY.NONE}>{i18n.t('priority_none')}</option>
                <option value={TASK_PRIORITY.LOW}>{i18n.t('priority_low')}</option>
                <option value={TASK_PRIORITY.MEDIUM}>{i18n.t('priority_medium')}</option>
                <option value={TASK_PRIORITY.HIGH}>{i18n.t('priority_high')}</option>
              </select>
            </div>
          </div>

          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.3rem', display: 'block' }}>
                  {i18n.t('due_date')}
                </label>
                <input
                  type="date"
                  class="m3-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.3rem', display: 'block' }}>
                  {i18n.t('due_time')}
                </label>
                <input
                  type="time"
                  class="m3-input"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
              <button
                type="button"
                class="list-pill"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
                onClick={() => setQuickDate('today')}
              >
                اليوم
              </button>
              <button
                type="button"
                class="list-pill"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
                onClick={() => setQuickDate('tomorrow')}
              >
                غداً
              </button>
              <button
                type="button"
                class="list-pill"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
                onClick={() => setQuickDate('next_week')}
              >
                الأسبوع القادم
              </button>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                {i18n.t('subtasks')} ({subtasks.length}/{maxSubtasks})
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                class="m3-input"
                placeholder={i18n.t('add_subtask')}
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
              />
              <button type="button" class="m3-btn-secondary" onClick={handleAddSubtask}>
                {i18n.t('add')}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '120px', overflowY: 'auto' }}>
              {subtasks.map(st => (
                <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--m3-surface-container)', padding: '0.4rem 0.75rem', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{st.title}</span>
                  <button type="button" onClick={() => handleRemoveSubtask(st.id)} style={{ background: 'none', border: 'none', color: 'var(--m3-error)', cursor: 'pointer' }}>
                    <span class="material-symbols-rounded" style={{ fontSize: '18px' }}>delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {tags && tags.length > 0 && (
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', display: 'block' }}>
                {i18n.t('tags')}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {tags.map(tag => {
                  const isSelected = selectedTags.includes(tag.name || tag.id);
                  return (
                    <button
                      type="button"
                      key={tag.id}
                      class={`list-pill ${isSelected ? 'active' : ''}`}
                      onClick={() => handleToggleTag(tag.name || tag.id)}
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: tag.color || '#4C662B', display: 'inline-block' }} />
                      <span>{tag.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', display: 'block' }}>
              {i18n.t('reminders')} ({reminders.length}/{maxReminders})
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {['15_mins', '30_mins', '1_hour', '1_day'].map(r => (
                <button
                  type="button"
                  key={r}
                  class={`list-pill ${reminders.includes(r) ? 'active' : ''}`}
                  onClick={() => handleToggleReminder(r)}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
                >
                  <span class="material-symbols-rounded" style={{ fontSize: '16px' }}>notifications</span>
                  {i18n.t(`reminder_${r}`)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--m3-surface-container)', padding: '0.75rem', borderRadius: '12px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', display: 'block' }}>
              <span class="material-symbols-rounded" style={{ fontSize: '16px', verticalAlign: 'middle', marginInlineEnd: '4px' }}>sync</span>
              {i18n.t('recurrence')}
            </label>
            <select
              class="m3-input"
              value={recurrenceFreq}
              onChange={(e) => setRecurrenceFreq(e.target.value)}
              style={{ marginBottom: '0.4rem' }}
            >
              <option value="none">{i18n.t('no_repeat')}</option>
              <option value={RECURRENCE_FREQ.DAILY}>{i18n.t('repeat_daily')}</option>
              <option value={RECURRENCE_FREQ.WEEKLY}>{i18n.t('repeat_weekly')}</option>
              <option value={RECURRENCE_FREQ.MONTHLY}>{i18n.t('repeat_monthly')}</option>
            </select>

            {recurrenceFreq !== 'none' && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  class="m3-input"
                  value={recurrenceEnd}
                  onChange={(e) => setRecurrenceEnd(e.target.value)}
                >
                  <option value={RECURRENCE_END.NEVER}>{i18n.t('ends_never')}</option>
                  <option value={RECURRENCE_END.COUNT}>{i18n.t('ends_count')}</option>
                </select>
                {recurrenceEnd === RECURRENCE_END.COUNT && (
                  <input
                    type="number"
                    min="1"
                    max="60"
                    class="m3-input"
                    style={{ width: '80px' }}
                    value={recurrenceCount}
                    onChange={(e) => setRecurrenceCount(e.target.value)}
                  />
                )}
              </div>
            )}
          </div>

          <div class="modal-actions-row">
            {task && onDelete && (
              <button
                type="button"
                class="m3-btn-danger"
                style={{ marginInlineEnd: 'auto' }}
                onClick={() => onDelete(task.id)}
              >
                {i18n.t('delete')}
              </button>
            )}
            <button type="button" class="m3-btn-secondary" onClick={onClose}>
              {i18n.t('cancel')}
            </button>
            <button type="submit" class="m3-btn-primary">
              {i18n.t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
