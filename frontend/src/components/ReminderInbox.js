import React, { useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  CheckCheck,
  Clock3,
  Filter,
  Mail,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reminderAPI } from '../api/api';

/**
 * ReminderInbox — Shared inbox component used by both Manager and Employee dashboards.
 *
 * Props:
 *   title          {string}   Page heading
 *   subtitle       {string}   Sub-heading beneath the title
 *   intro          {string}   Professional role-based description shown inside the
 *                             info card — provided by the parent page, NOT hardcoded here.
 *   emptyTitle     {string}   Heading when the filtered list is empty
 *   emptyMessage   {string}   Body copy when the filtered list is empty
 *   showScanButton {boolean}  Whether to show the "Run deadline scan" button (managers only)
 *   allowedTypes   {string[]} Which reminder types this role is allowed to see:
 *                               Manager  → ['MANAGER_ALERT']
 *                               Employee → ['EMPLOYEE_REMINDER']
 *                             Defaults to both if omitted (not recommended in production).
 *
 * Role segregation:
 *   The parent pages (ManagerReminders / EmployeeReminders) pass the correct
 *   allowedTypes so that:
 *     - Managers see MANAGER_ALERT (their projects' deadline alerts)
 *     - Employees see EMPLOYEE_REMINDER (their personal task reminders)
 *     - Admin users are excluded at the API level (backend returns []) and
 *       are never routed to a reminders page via App.js.
 */

const typeMeta = {
  EMPLOYEE_REMINDER: {
    label: 'Employee reminder',
    icon: Mail,
    accent: '#6366f1',
    chip: 'badge-blue',
  },
  MANAGER_ALERT: {
    label: 'Manager alert',
    icon: Users,
    accent: '#f43f5e',
    chip: 'badge-red',
  },
};

const formatDueLabel = (daysUntilDue) => {
  if (daysUntilDue == null) return 'No deadline data';
  if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} day(s) overdue`;
  if (daysUntilDue === 0) return 'Due today';
  if (daysUntilDue === 1) return 'Due tomorrow';
  return `Due in ${daysUntilDue} day(s)`;
};

const sortReminders = (items) =>
  [...items].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    const aDue = typeof a.daysUntilDue === 'number' ? a.daysUntilDue : 999;
    const bDue = typeof b.daysUntilDue === 'number' ? b.daysUntilDue : 999;
    return aDue - bDue;
  });

export default function ReminderInbox({
  title,
  subtitle,
  intro,
  emptyTitle,
  emptyMessage,
  showScanButton = false,
  allowedTypes = ['EMPLOYEE_REMINDER', 'MANAGER_ALERT'],
}) {
  const [reminders, setReminders] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [filterRead, setFilterRead] = useState('ALL');
  const [query, setQuery] = useState('');
  const [scanning, setScanning] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [itemsRes, unreadRes] = await Promise.all([
        reminderAPI.getAll(),
        reminderAPI.getUnreadCount(),
      ]);
      setReminders(itemsRes.data || []);
      setUnreadCount(unreadRes.data?.count || 0);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const derived = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = sortReminders(
      reminders.filter((reminder) => {
        // Only show reminder types that this role is allowed to see
        const matchesType =
          (filterType === 'ALL' && allowedTypes.includes(reminder.type)) ||
          reminder.type === filterType;
        const matchesRead =
          filterRead === 'ALL' ||
          (filterRead === 'READ' && reminder.read) ||
          (filterRead === 'UNREAD' && !reminder.read);
        const haystack = [
          reminder.message,
          reminder.task?.title,
          reminder.task?.projectName,
          reminder.task?.assignedToName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
        return matchesType && matchesRead && matchesQuery;
      })
    );

    // Stats are scoped to allowedTypes for this role
    const scopedReminders = reminders.filter((r) => allowedTypes.includes(r.type));
    const total = scopedReminders.length;
    const unread = scopedReminders.filter((r) => !r.read).length;
    const overdue = scopedReminders.filter((r) => (r.daysUntilDue ?? 0) < 0).length;
    const dueSoon = scopedReminders.filter(
      (r) => (r.daysUntilDue ?? 99) >= 0 && (r.daysUntilDue ?? 99) <= 3
    ).length;
    const employeeAlerts = reminders.filter((r) => r.type === 'EMPLOYEE_REMINDER').length;
    const managerAlerts = reminders.filter((r) => r.type === 'MANAGER_ALERT').length;

    return { filtered, total, unread, overdue, dueSoon, employeeAlerts, managerAlerts };
  }, [filterRead, filterType, query, reminders, allowedTypes]);

  const handleMarkRead = async (id) => {
    try {
      const res = await reminderAPI.markRead(id);
      const updated = res.data;
      setReminders((current) => current.map((r) => (r.id === id ? updated : r)));
      setUnreadCount((count) => Math.max(0, count - 1));
      toast.success('Marked as read');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to mark reminder as read');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await reminderAPI.delete(id);
      setReminders((current) => current.filter((r) => r.id !== id));
      setUnreadCount((count) => Math.max(0, count - 1));
      toast.success('Reminder deleted');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete reminder');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await reminderAPI.markAllRead();
      setReminders((current) => current.map((r) => ({ ...r, read: true })));
      setUnreadCount(0);
      toast.success('All reminders marked as read');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to mark all reminders as read');
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await reminderAPI.scan();
      toast.success(`Reminder scan complete. ${res.data?.remindersCreated ?? 0} new reminders created.`);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to run reminder scan');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="reminder-shell fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <div className="reminder-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
          {showScanButton && (
            <button className="btn btn-secondary btn-sm" onClick={handleScan} disabled={scanning}>
              <BellRing size={16} /> {scanning ? 'Scanning...' : 'Run deadline scan'}
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={16} /> Mark all read
          </button>
        </div>
      </div>

      {/* ── Info card with role-specific intro text (passed as prop) ── */}
      <div className="card reminder-hero">
        <div>
          <div className="reminder-kicker">
            <Clock3 size={14} />
            Deadline monitoring
          </div>
          <h2 style={{ fontSize: '1.1rem', margin: '0.35rem 0 0.5rem', fontWeight: 700 }}>
            Reminder Inbox
          </h2>
          {/* intro text is role-specific and provided by the parent page */}
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {intro}
          </p>
        </div>

        <div className="grid grid-4 reminder-stats">
          {[
            { label: 'Unread', value: unreadCount, color: '#fbbf24' },
            { label: 'Total', value: derived.total, color: '#818cf8' },
            { label: 'Due soon', value: derived.dueSoon, color: '#22d3ee' },
            { label: 'Overdue', value: derived.overdue, color: '#fb7185' },
          ].map((item) => (
            <div key={item.label} className="reminder-stat">
              <div className="reminder-stat-value" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="reminder-stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="reminder-controls">
          <div className="reminder-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search task, project, assignee, or message"
            />
          </div>

          {/* Type filter: only show tabs for types this role can see */}
          {allowedTypes.length > 1 && (
            <div className="reminder-filters">
              <div className="reminder-filter-label">
                <Filter size={14} />
                Type
              </div>
              {(['ALL', ...allowedTypes].filter(
                (value, index, arr) => arr.indexOf(value) === index
              )).map((type) => (
                <button
                  key={type}
                  className={`btn btn-sm ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setFilterType(type);
                    setFilterRead('ALL');
                  }}
                >
                  {type === 'ALL' ? 'All types' : typeMeta[type]?.label ?? type}
                </button>
              ))}
            </div>
          )}

          <div className="reminder-filters">
            <div className="reminder-filter-label">
              <Filter size={14} />
              Read
            </div>
            {['ALL', 'UNREAD', 'READ'].map((value) => (
              <button
                key={value}
                className={`btn btn-sm ${filterRead === value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterRead(value)}
              >
                {value === 'ALL' ? 'All' : value.charAt(0) + value.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Reminder list ── */}
      <div className="card">
        {loading ? (
          <div className="empty-state">
            <div className="pulse" style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}>
              Loading
            </div>
            <p>Fetching reminder inbox...</p>
          </div>
        ) : derived.filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <BellRing size={42} />
            </div>
            <p>{emptyTitle}</p>
            <span className="empty-state-text">{emptyMessage}</span>
          </div>
        ) : (
          <div className="reminder-list">
            {derived.filtered.map((reminder) => {
              const meta = typeMeta[reminder.type] || typeMeta.EMPLOYEE_REMINDER;
              const Icon = meta.icon;
              const urgency =
                (reminder.daysUntilDue ?? 99) < 0
                  ? 'reminder-critical'
                  : (reminder.daysUntilDue ?? 99) <= 1
                    ? 'reminder-high'
                    : (reminder.daysUntilDue ?? 99) <= 3
                      ? 'reminder-medium'
                      : 'reminder-low';

              return (
                <div
                  key={reminder.id}
                  className={`reminder-card ${reminder.read ? 'is-read' : 'is-unread'}`}
                >
                  <div className="reminder-accent" style={{ background: meta.accent }} />

                  <div className="reminder-main">
                    <div className="reminder-topline">
                      <div className="reminder-title-row">
                        <span className={`badge ${meta.chip}`}>{meta.label}</span>
                        {!reminder.read && (
                          <span className="reminder-unread-dot">New</span>
                        )}
                        <span className={`reminder-urgency ${urgency}`}>
                          {formatDueLabel(reminder.daysUntilDue)}
                        </span>
                      </div>
                      <span className="reminder-time">
                        {reminder.createdAt
                          ? new Date(reminder.createdAt).toLocaleString()
                          : 'Recently'}
                      </span>
                    </div>

                    <div className="reminder-message">
                      <Icon size={18} />
                      <p>{reminder.message}</p>
                    </div>

                    {reminder.task && (
                      <div className="reminder-task-grid">
                        <div>
                          <span className="reminder-meta-label">Task</span>
                          <strong>{reminder.task.title}</strong>
                        </div>
                        <div>
                          <span className="reminder-meta-label">Project</span>
                          <strong>{reminder.task.projectName || 'Unknown project'}</strong>
                        </div>
                        <div>
                          <span className="reminder-meta-label">Assignee</span>
                          <strong>{reminder.task.assignedToName || 'Unassigned'}</strong>
                        </div>
                        <div>
                          <span className="reminder-meta-label">Deadline</span>
                          <strong>{reminder.task.dueDate || 'No due date'}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="reminder-actions">
                    {!reminder.read && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleMarkRead(reminder.id)}
                      >
                        <CheckCheck size={15} /> Mark read
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDelete(reminder.id)}
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}