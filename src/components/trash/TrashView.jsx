import React from 'react';
import { i18n } from '../../services/i18n.js';
import { storageService } from '../../services/storage.js';

export function TrashView({ onRefresh }) {
  const trashItems = storageService.getTrashItems();

  const handleRestore = (item) => {
    storageService.restoreItem(item.itemType, item.id);
    onRefresh();
  };

  const handleEmptyTrash = () => {
    if (window.confirm(i18n.t('confirm_empty_trash'))) {
      storageService.emptyTrash();
      onRefresh();
    }
  };

  const calculateDaysLeft = (deletedAt) => {
    if (!deletedAt) return 7;
    const deletedTime = new Date(deletedAt).getTime();
    const expiryTime = deletedTime + (7 * 24 * 60 * 60 * 1000);
    const msLeft = expiryTime - Date.now();
    return Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{i18n.t('trash_title')}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--m3-text-secondary)', marginTop: '0.2rem' }}>
            {i18n.t('trash_desc')}
          </p>
        </div>

        {trashItems.length > 0 && (
          <button class="m3-btn-danger" onClick={handleEmptyTrash}>
            <span class="material-symbols-rounded" style={{ fontSize: '18px', verticalAlign: 'middle' }}>delete_forever</span>
            <span>{i18n.t('empty_trash')}</span>
          </button>
        )}
      </div>

      {trashItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--m3-text-muted)' }}>
          <span class="material-symbols-rounded" style={{ fontSize: '48px', opacity: 0.5 }}>delete_outline</span>
          <p style={{ marginTop: '0.5rem', fontWeight: '700' }}>{i18n.t('no_trash')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {trashItems.map(item => {
            const daysLeft = calculateDaysLeft(item.deleted_at);
            const iconMap = { task: 'task', list: 'list', note: 'description', habit: 'star' };

            return (
              <div
                key={`${item.itemType}_${item.id}`}
                class="task-card"
                style={{ opacity: 0.85 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--m3-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--m3-text-secondary)' }}>
                      <span class="material-symbols-rounded" style={{ fontSize: '20px' }}>
                        {iconMap[item.itemType] || 'delete'}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: '800' }}>
                        {item.title || item.name || i18n.t('new_task')}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--m3-error)', fontWeight: '700', marginTop: '0.1rem' }}>
                        {i18n.t('days_left', String(daysLeft))}
                      </div>
                    </div>
                  </div>

                  <button
                    class="m3-btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}
                    onClick={() => handleRestore(item)}
                  >
                    <span class="material-symbols-rounded" style={{ fontSize: '16px', verticalAlign: 'middle' }}>restore</span>
                    <span>{i18n.t('restore')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
