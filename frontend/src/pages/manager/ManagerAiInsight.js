import React from 'react';
import Sidebar from '../../components/Sidebar';
import AiInsightPage from '../../components/AiInsightPage';

export default function ManagerAiInsight() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <AiInsightPage role="PROJECT_MANAGER" />
      </main>
    </div>
  );
}
