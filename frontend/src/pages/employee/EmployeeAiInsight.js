import React from 'react';
import Sidebar from '../../components/Sidebar';
import AiInsightPage from '../../components/AiInsightPage';

export default function EmployeeAiInsight() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <AiInsightPage role="EMPLOYEE" />
      </main>
    </div>
  );
}
