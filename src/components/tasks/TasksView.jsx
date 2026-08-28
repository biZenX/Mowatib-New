import React, { useState } from 'react';
import { i18n } from '../../services/i18n.js';
import { storageService } from '../../services/storage.js';
import { audioService } from '../../services/audio.js';
import { TASK_STATUS, TASK_PRIORITY, isTaskOverdue } from '../../domain/taskRules.js';
import { TaskModal } from './TaskModal.jsx';

export function TasksView({ onOpenPaywall }) {
  const [selectedListId, setSelectedListId] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [selectedTag, setSelectedTag] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [tick, setTick] = useState(0);

  const lists = storageService.getLists();
  const tags = storageService.tags;
  const isPremium = storageService.settings.isPremium;

  let tasks = storageService.getActiveTasks();

  if (selectedListId === 'inbox') {
    tasks = tasks.filter(t => t.list_id === null);
  } else if (selectedListId !== 'all') {
    tasks = tasks.filter(t => t.list_id === selectedListId);
  }

  if (selectedTag) {
    tasks = tasks.filter(t => t.tags && t.tags.includes(selectedTag));
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    tasks = tasks.filter(t =>
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  }

  if (sortBy === 'dueDate') {
    tasks.sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'));
  } else if (sortBy === 'priority') {
    const pRank = { high: 3, medium: 2, low: 1, none: 0 };
    tasks.sort((a, b) => (pRank[b.priority || 'none'] || 0) - (pRank[a.priority || 'none'] || 0));
  } else if (sortBy === 'title') {
    tasks.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  const handleToggleTask = (task) => {
    audioService.playClick();
    const nextStatus = task.status === TASK_STATUS.DONE ? TASK_STATUS.IN_PROGRESS : TASK_STATUS.DONE;
    storageService.updateTask(task.id, { status: nextStatus });
    setTick(t => t + 1);
  };

  const handleToggleSubtask = (taskId, subtaskId, e) => {
    e.stopPropagation();
    audioService.playClick();
    storageService.toggleSubtask(taskId, subtaskId);
    setTick(t => t + 1);
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    try {
      const targetListId = (selectedListId !== 'all' && selectedListId !== 'inbox') ? selectedListId : null;
      storageService.createTask({
        title: quickTitle.trim(),
        list_id: targetListId,
        priority: TASK_PRIORITY.NONE,
        status: TASK_STATUS.TODO
      });
      setQuickTitle('');
      setTick(t => t + 1);
    } catch (err) {
      if (err.message && err.message.includes('limit')) {
        onOpenPaywall();
      }
    }
  };

  const handleSaveTask = (taskData) => {
    try {
      if (editingTask) {
        storageService.updateTask(editingTask.id, taskData);
      } else {
        storageService.createTask(taskData);
      }
      setEditingTask(null);
      setIsCreatingTask(false);
      setTick(t => t + 1);
    } catch (err) {
      if (err.message && err.message.includes('limit')) {
        onOpenPaywall();
      }
    }
  };

  const handleDeleteTask = (taskId) => {
    storageService.deleteTask(taskId);
    setEditingTask(null);
    setTick(t => t + 1);
  };

  const handleCreateList = (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      storageService.createList(newListName.trim());
      setNewListName('');
      setIsCreatingList(false);
      setTick(t => t + 1);
    } catch (err) {
      if (err.message && err.message.includes('limit')) {
        onOpenPaywall();
      }
    }
  };

  const handleDragStart = (taskId) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetStatus) => {
    if (draggedTaskId) {
      storageService.updateTask(draggedTaskId, { status: targetStatus });
      setDraggedTaskId(null);
      setTick(t => t + 1);
    }
  };

  const toggleTaskExpansion = (taskId, e) => {
    e.stopPropagation();
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  return (
    <div class="tasks-layout">
      <div class="tasks-top-bar">
        <div class="tasks-search-wrap">
          <span class="material-symbols-rounded tasks-search-icon">search</span>
          <input
            type="text"
            class="tasks-search-input"
            placeholder={i18n.t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div class="view-mode-toggle">
            <button
              class={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <span class="material-symbols-rounded" style={{ fontSize: '18px' }}>format_list_bulleted</span>
              <span>{i18n.t('list_view')}</span>
            </button>
            <button
              class={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              <span class="material-symbols-rounded" style={{ fontSize: '18px' }}>view_kanban</span>
              <span>{i18n.t('kanban_view')}</span>
            </button>
          </div>

          <button class="m3-btn-primary" onClick={() => setIsCreatingTask(true)}>
            <span class="material-symbols-rounded" style={{ fontSize: '20px', verticalAlign: 'middle' }}>add</span>
            <span>{i18n.t('new_task')}</span>
          </button>
        </div>
      </div>

      <div class="lists-sidebar-pills">
        <button
          class={`list-pill ${selectedListId === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedListId('all')}
        >
          <span class="material-symbols-rounded" style={{ fontSize: '18px' }}>all_inclusive</span>
          <span>{i18n.t('all')}</span>
        </button>

        <button
          class={`list-pill ${selectedListId === 'inbox' ? 'active' : ''}`}
          onClick={() => setSelectedListId('inbox')}
        >
          <span class="material-symbols-rounded" style={{ fontSize: '18px' }}>inbox</span>
          <span>{i18n.t('inbox')}</span>
        </button>

        {lists.map(list => (
          <button
            key={list.id}
            class={`list-pill ${selectedListId === list.id ? 'active' : ''}`}
            onClick={() => setSelectedListId(list.id)}
          >
            <span class="material-symbols-rounded" style={{ fontSize: '18px', color: list.color }}>
              {list.icon || 'list'}
            </span>
            <span>{list.name}</span>
          </button>
        ))}

        <button
          class="list-pill"
          style={{ borderStyle: 'dashed' }}
          onClick={() => setIsCreatingList(true)}
        >
          <span class="material-symbols-rounded" style={{ fontSize: '18px' }}>add</span>
          <span>{i18n.t('new_list')}</span>
        </button>
      </div>

      <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', width: '100%' }}>
        <input
          type="text"
          class="m3-input"
          style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '16px' }}
          placeholder="أضف مهمة جديدة واضغط Enter لإضافتها سريعاً..."
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
        />
        <button type="submit" class="m3-btn-primary" style={{ borderRadius: '16px', padding: '0.75rem 1.25rem' }}>
          <span class="material-symbols-rounded" style={{ fontSize: '20px' }}>add_task</span>
        </button>
      </form>

      {viewMode === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--m3-text-muted)' }}>
              <span class="material-symbols-rounded" style={{ fontSize: '48px', opacity: 0.5 }}>task_alt</span>
              <p style={{ marginTop: '0.5rem', fontWeight: '700' }}>{i18n.t('no_tasks')}</p>
            </div>
          ) : (
            tasks.map(task => {
              const isOverdue = isTaskOverdue(task.due_date, task.due_time, task.status);
              const completedSubtasks = (task.subtasks || []).filter(s => s.is_completed).length;
              const totalSubtasks = (task.subtasks || []).length;
              const isExpanded = Boolean(expandedTasks[task.id]);

              return (
                <div
                  key={task.id}
                  class="task-card"
                  onClick={() => setEditingTask(task)}
                >
                  <div class="task-card-header">
                    <button
                      type="button"
                      class={`task-checkbox ${task.status === TASK_STATUS.DONE ? 'checked' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleToggleTask(task); }}
                    >
                      {task.status === TASK_STATUS.DONE && (
                        <span class="material-symbols-rounded" style={{ fontSize: '16px' }}>check</span>
                      )}
                    </button>

                    <div style={{ flex: 1 }}>
                      <div class={`task-title-text ${task.status === TASK_STATUS.DONE ? 'done' : ''}`}>
                        {task.title}
                      </div>

                      {task.description && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--m3-text-secondary)', marginTop: '0.2rem' }}>
                          {task.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {totalSubtasks > 0 && (
                    <div style={{ marginInlineStart: '2rem' }}>
                      <button
                        type="button"
                        onClick={(e) => toggleTaskExpansion(task.id, e)}
                        style={{ background: 'none', border: 'none', color: 'var(--m3-primary)', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <span class="material-symbols-rounded" style={{ fontSize: '16px' }}>
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                        {i18n.t('subtasks')} ({completedSubtasks}/{totalSubtasks})
                      </button>

                      {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.4rem' }}>
                          {task.subtasks.map(st => (
                            <div
                              key={st.id}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', cursor: 'pointer' }}
                              onClick={(e) => handleToggleSubtask(task.id, st.id, e)}
                            >
                              <div class={`task-checkbox ${st.is_completed ? 'checked' : ''}`} style={{ width: '18px', height: '18px' }}>
                                {st.is_completed && <span class="material-symbols-rounded" style={{ fontSize: '14px' }}>check</span>}
                              </div>
                              <span style={{ textDecoration: st.is_completed ? 'line-through' : 'none', color: st.is_completed ? 'var(--m3-text-muted)' : 'inherit' }}>
                                {st.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div class="task-meta-row" style={{ marginInlineStart: '2rem' }}>
                    {task.priority && task.priority !== TASK_PRIORITY.NONE && (
                      <span class={`priority-badge priority-${task.priority}`}>
                        {i18n.t(`priority_${task.priority}`)}
                      </span>
                    )}

                    {task.due_date && (
                      <span class={`due-date-badge ${isOverdue ? 'overdue' : ''}`}>
                        <span class="material-symbols-rounded" style={{ fontSize: '15px' }}>calendar_today</span>
                        <span>{task.due_date} {task.due_time ? task.due_time : ''}</span>
                        {isOverdue && <span>({i18n.t('overdue')})</span>}
                      </span>
                    )}

                    {task.recurrence && (
                      <span style={{ color: 'var(--m3-primary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <span class="material-symbols-rounded" style={{ fontSize: '15px' }}>sync</span>
                        <span>{i18n.t(`repeat_${task.recurrence.frequency}`)}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {viewMode === 'kanban' && (
        <div class="kanban-board">
          {[
            { id: TASK_STATUS.TODO, label: i18n.t('status_todo'), color: '#3d5622' },
            { id: TASK_STATUS.IN_PROGRESS, label: i18n.t('status_in_progress'), color: '#7C4DFF' },
            { id: TASK_STATUS.DONE, label: i18n.t('status_done'), color: '#2E7D32' }
          ].map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                class="kanban-column"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.id)}
              >
                <div class="kanban-col-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: col.color }} />
                    <span>{col.label}</span>
                  </div>
                  <span class="kanban-count-badge">{colTasks.length}</span>
                </div>

                <div class="kanban-tasks-list">
                  {colTasks.map(t => (
                    <div
                      key={t.id}
                      class="task-card"
                      draggable
                      onDragStart={() => handleDragStart(t.id)}
                      onClick={() => setEditingTask(t)}
                    >
                      <div class="task-title-text">{t.title}</div>
                      {t.description && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--m3-text-secondary)' }}>
                          {t.description}
                        </div>
                      )}
                      <div class="task-meta-row">
                        {t.priority !== TASK_PRIORITY.NONE && (
                          <span class={`priority-badge priority-${t.priority}`}>
                            {i18n.t(`priority_${t.priority}`)}
                          </span>
                        )}
                        {t.due_date && (
                          <span class="due-date-badge">
                            <span class="material-symbols-rounded" style={{ fontSize: '14px' }}>event</span>
                            {t.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(isCreatingTask || editingTask) && (
        <TaskModal
          task={editingTask}
          lists={lists}
          tags={tags}
          isPremium={isPremium}
          onClose={() => { setEditingTask(null); setIsCreatingTask(false); }}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}

      {isCreatingList && (
        <div class="m3-modal-backdrop" onClick={() => setIsCreatingList(false)}>
          <div class="m3-modal-card" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h2 class="modal-title">{i18n.t('new_list')}</h2>
              <button class="m3-action-btn" onClick={() => setIsCreatingList(false)}>
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateList} class="modal-body">
              <input
                type="text"
                class="m3-input"
                placeholder={i18n.t('list_name')}
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                autoFocus
              />
              <div class="modal-actions-row">
                <button type="button" class="m3-btn-secondary" onClick={() => setIsCreatingList(false)}>
                  {i18n.t('cancel')}
                </button>
                <button type="submit" class="m3-btn-primary">
                  {i18n.t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
