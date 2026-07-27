'use client'

import { useState } from 'react'
import {
  CheckSquare,
  Square,
  MessageSquare,
  AlertTriangle,
  Package,
  Cake,
  Clock,
  ChevronRight,
  UserCheck,
} from 'lucide-react'
import { WhatsAppModal } from '@/components/crm/whatsapp-modal'
import type { CRMTaskItem } from '@/lib/actions/crm'

interface CRMTaskManagerProps {
  initialTasks: CRMTaskItem[]
}

export function CRMTaskManager({ initialTasks }: CRMTaskManagerProps) {
  const [tasks, setTasks] = useState<CRMTaskItem[]>(initialTasks)
  const [selectedTaskForWA, setSelectedTaskForWA] = useState<CRMTaskItem | null>(null)

  const toggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t))
    )
  }

  const getTaskIcon = (type: CRMTaskItem['taskType']) => {
    switch (type) {
      case 'renewal': return <Package size={15} className="text-warning" />
      case 'followup': return <UserCheck size={15} className="text-brand" />
      case 'birthday': return <Cake size={15} className="text-pink" />
      default: return <Clock size={15} className="text-muted" />
    }
  }

  const getWATemplateType = (type: CRMTaskItem['taskType']) => {
    switch (type) {
      case 'renewal': return 'renewal'
      case 'followup': return 'inactive'
      case 'birthday': return 'birthday'
      default: return 'schedule'
    }
  }

  return (
    <div className="glass-card task-manager-card">
      {/* Header */}
      <div className="task-header">
        <div className="task-title-wrap">
          <div className="task-header-icon">
            <CheckSquare size={18} />
          </div>
          <div>
            <h3 className="task-card-title">Task Manager Harian PT</h3>
            <p className="task-card-sub">Daftar follow-up otomatis untuk menjaga retensi klien</p>
          </div>
        </div>
        <span className="task-count-badge">
          {tasks.filter(t => !t.isCompleted).length} Tugas Aktif
        </span>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="task-empty">
          <UserCheck size={32} style={{ opacity: 0.3 }} />
          <p>Semua tugas follow-up harian telah selesai! 🎉</p>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map(task => (
            <div
              key={task.id}
              className={`task-item ${task.isCompleted ? 'completed' : ''}`}
            >
              {/* Checkbox */}
              <button
                type="button"
                className="task-checkbox-btn"
                onClick={() => toggleTask(task.id)}
              >
                {task.isCompleted ? (
                  <CheckSquare size={18} className="task-check-active" />
                ) : (
                  <Square size={18} className="task-check-muted" />
                )}
              </button>

              {/* Icon & Details */}
              <div className="task-content">
                <div className="task-top-row">
                  {getTaskIcon(task.taskType)}
                  <span className="task-title">{task.title}</span>
                </div>
                <p className="task-desc">{task.desc}</p>
              </div>

              {/* WA Action Button */}
              <button
                type="button"
                className="task-wa-btn"
                onClick={() => setSelectedTaskForWA(task)}
                title="Kirim Pesan WhatsApp"
              >
                <MessageSquare size={14} />
                <span>WA</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* WhatsApp Modal for Selected Task */}
      {selectedTaskForWA && (
        <WhatsAppModal
          isOpen={Boolean(selectedTaskForWA)}
          onClose={() => setSelectedTaskForWA(null)}
          clientData={{
            id: selectedTaskForWA.clientId,
            fullName: selectedTaskForWA.clientName,
            phone: selectedTaskForWA.phone,
          }}
          defaultTemplate={getWATemplateType(selectedTaskForWA.taskType)}
        />
      )}

      <style jsx global>{`
        .task-manager-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .task-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .task-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .task-header-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: var(--brand-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .task-card-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .task-card-sub {
          font-size: 12.5px;
          color: var(--text-muted);
        }
        .task-count-badge {
          background: rgba(249, 115, 22, 0.15);
          border: 1px solid rgba(249, 115, 22, 0.3);
          color: #f97316;
          font-size: 11.5px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 50px;
        }

        .task-empty {
          padding: 30px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13.5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .task-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .task-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
        }
        .task-item:hover {
          border-color: var(--border-brand);
          background: var(--bg-elevated);
        }
        .task-item.completed {
          opacity: 0.55;
        }
        .task-item.completed .task-title {
          text-decoration: line-through;
        }

        :global(.task-checkbox-btn) {
          background: none;
          border: none;
          padding: 2px;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          margin-top: 2px;
        }
        :global(.task-check-active) {
          color: var(--brand-primary);
        }

        .task-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .task-top-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .task-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .task-desc {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        :global(.task-wa-btn) {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 50px;
          font-size: 11.5px;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }
        :global(.task-wa-btn:hover) {
          background: #10b981;
          color: white;
        }

        :global(.text-warning) { color: #f59e0b; }
        :global(.text-brand) { color: var(--brand-primary); }
        :global(.text-pink) { color: #ec4899; }
      `}</style>
    </div>
  )
}
