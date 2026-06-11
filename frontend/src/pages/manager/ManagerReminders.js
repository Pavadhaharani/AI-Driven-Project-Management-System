import React from 'react';
import Sidebar from '../../components/Sidebar';
import ReminderInbox from '../../components/ReminderInbox';

/**
 * ManagerReminders — Project Manager view of the reminder inbox.
 *
 * Shows MANAGER_ALERT reminders only. These are generated automatically
 * when any task across the manager's projects approaches its deadline
 * without a recent completion update.
 *
 * showScanButton is enabled so managers can manually trigger the deadline
 * scan during testing or ad-hoc review.
 */
export default function ManagerReminders() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <ReminderInbox
          title="Deadline Reminders"
          subtitle="Manager view for tasks that need attention across your projects."
          intro="This inbox highlights tasks that require attention across your projects, including both your own and your team members' assignments. Reminders are automatically generated when tasks approach their deadlines without recent updates, helping you monitor progress and ensure timely completion."
          emptyTitle="No manager reminders right now"
          emptyMessage="When a task approaches its deadline without a completion update, the manager alert will appear here."
          showScanButton
          allowedTypes={['MANAGER_ALERT']}
        />
      </main>
    </div>
  );
}