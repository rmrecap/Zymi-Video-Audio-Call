import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';

const RoadmapTimeline = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/project-brain/tasks`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    })
    .then(res => res.json())
    .then(data => setTasks(data));
  }, []);

  return (
    <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
        <h3 className="font-bold text-white">Roadmap Timeline</h3>
        <button className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
      <div className="p-6">
        <div className="relative border-l border-slate-800 ml-3 space-y-8">
          {tasks.length === 0 ? (
            <div className="text-slate-500 text-sm italic pl-6">No tasks defined in roadmap yet.</div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="relative pl-8">
                <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-[#1e293b] ${
                  task.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-600'
                }`} />
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className={`text-sm font-bold ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {task.task_title}
                    </h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                      task.priority === 'high' ? 'text-rose-400 bg-rose-400/10' : 'text-slate-400 bg-slate-400/10'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  {task.notes && <p className="text-xs text-slate-500 leading-relaxed">{task.notes}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RoadmapTimeline;
