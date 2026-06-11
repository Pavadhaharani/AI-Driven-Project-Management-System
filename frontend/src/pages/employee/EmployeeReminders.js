import React from 'react';
import Sidebar from '../../components/Sidebar';
import ReminderInbox from '../../components/ReminderInbox';

/**
 * EmployeeReminders — Employee view of the reminder inbox.
 *
 * Shows EMPLOYEE_REMINDER reminders only — tasks personally assigned to this
 * employee that are nearing their deadline without a recent completion update.
 *
 * showScanButton is intentionally omitted (false by default): employees do
 * not need to trigger system-wide deadline scans.
 */
export default function EmployeeReminders() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <ReminderInbox
          title="My Deadline Reminders"
          subtitle="Your personal inbox for assigned tasks that are approaching or past their due date."
          intro="This inbox highlights your assigned tasks that require attention before their deadlines. Reminders are automatically generated when a task is nearing its due date and has no recent progress updates, helping you stay on track."
          emptyTitle="No reminders for you right now"
          emptyMessage="When one of your assigned tasks approaches its deadline without a completion update, your reminder will appear here."
          allowedTypes={['EMPLOYEE_REMINDER']}
        />
      </main>
    </div>
  );
}