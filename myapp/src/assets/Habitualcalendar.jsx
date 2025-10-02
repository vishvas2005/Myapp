import React, { useState, useEffect } from "react";
import { format, subDays, isToday } from "date-fns";
import Calendar from "react-calendar"; 
import { Toaster, toast } from "react-hot-toast";
import { Lock, Edit3, Trash2, Save } from 'lucide-react';

// Renamed component to follow React conventions (PascalCase)
function HabitualCalendar() {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("tasks");
    return savedTasks ? JSON.parse(savedTasks) : {};
  });

  const [newTaskText, setNewTaskText] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState("");
  const [streak, setStreak] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Effect to save tasks to localStorage
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Effect to calculate the streak
  useEffect(() => {
    let currentStreak = 0;
    // FIX: Start checking from YESTERDAY to not break the streak on the current day
    let dateToCheck = subDays(new Date(), 1); 

    while (true) {
      const formattedDate = format(dateToCheck, "yyyy-MM-dd");
      const tasksForDay = tasks[formattedDate];
      if (tasksForDay && tasksForDay.length > 0 && tasksForDay.every((t) => t.completed)) {
        currentStreak++;
        dateToCheck = subDays(dateToCheck, 1);
      } else {
        break;
      }
    }
    setStreak(currentStreak);
  }, [tasks]);

  // --- Handlers ---
  const handleAddTask = () => {
    // FIX: Added a return statement to prevent adding empty tasks
    if (newTaskText.trim() === "") {
      toast.error("Task cannot be empty! 💀");
      return;
    }
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const newTask = { id: Date.now(), text: newTaskText, completed: false };
    const updatedTasks = { ...tasks };
    updatedTasks[formattedDate] = [...(updatedTasks[formattedDate] || []), newTask];
    setTasks(updatedTasks);
    setNewTaskText("");
    toast.success("Task added! 📌");
  };

  const handleToggleTask = (taskId) => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const updatedTasksForDay = tasks[formattedDate].map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setTasks({ ...tasks, [formattedDate]: updatedTasksForDay });
  };

  const handleDeleteTask = (taskId) => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const updatedTasksForDay = tasks[formattedDate].filter((t) => t.id !== taskId);
    setTasks({ ...tasks, [formattedDate]: updatedTasksForDay });
    toast("Task deleted.", { icon: "🗑️" });
  };

  const handleStartEditing = (task) => {
    setEditingTaskId(task.id);
    setEditingTaskText(task.text);
  };

  const handleSaveEdit = (taskId) => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const updatedTasksForDay = tasks[formattedDate].map((t) =>
      t.id === taskId ? { ...t, text: editingTaskText } : t
    );
    setTasks({ ...tasks, [formattedDate]: updatedTasksForDay });
    setEditingTaskId(null);
    setEditingTaskText("");
    toast.success("Task updated!");
  };

  // --- Calendar Helper Functions ---
  // PERFORMANCE FIX: Create a single, stable 'today' variable for each render
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tileDisabled = ({ date, view }) => {
    return view === 'month' && date > today;
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month' && date > today) {
      return <Lock className="h-4 w-4 text-slate-500" />;
    }
    return null;
  };
  
  const getTileClassName = ({ date, view }) => {
    if (view === 'month') {
      if (date > today) {
        return "future-date";
      }
      const formattedDate = format(date, "yyyy-MM-dd");
      const tasksForDay = tasks[formattedDate];
      if (!tasksForDay || tasksForDay.length === 0) return null;

      // UX FIX: Today's pending tasks are blue, past incomplete tasks are red
      if (tasksForDay.every((t) => t.completed)) return "!bg-green-500 text-white rounded-full";
      if (isToday(date) && tasksForDay.some((t) => !t.completed)) return "!bg-blue-500 text-white rounded-full";
      if (tasksForDay.some((t) => !t.completed)) return "!bg-red-500 text-white rounded-full";
    }
    return null;
  };

  const tasksForSelectedDay = tasks[format(selectedDate, "yyyy-MM-dd")] || [];

  return (
    <div className="p-4 max-w-4xl mx-auto font-sans">
      <Toaster position="top-center" />
      <h1 className="text-center text-3xl font-bold my-4">Habitual 🔥 {streak}</h1>

      <div className="my-4">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileClassName={getTileClassName}
          tileDisabled={tileDisabled}
          tileContent={tileContent}
        />
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">
        Tasks for {format(selectedDate, "MMMM do, yyyy")}
      </h2>

      {/* REFACTORED: Input and button using Flexbox for stable layout */}
      <div className="flex items-center gap-2 mb-8">
        <input
          className="flex-grow border-b-2 border-gray-300 focus:border-indigo-500 outline-none p-2"
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task..."
        />
        <button
          className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          onClick={handleAddTask}
        >
          Add
        </button>
      </div>
      
      {/* REFACTORED: Task list with Tailwind classes */}
      <ul className="space-y-3">
        {tasksForSelectedDay.length > 0 ? (
          tasksForSelectedDay.map((task) => (
            <li
              key={task.id}
              className="flex items-center p-4 bg-slate-800 text-white rounded-lg"
            >
              {editingTaskId === task.id ? (
                <>
                  <input
                    type="text"
                    value={editingTaskText}
                    onChange={(e) => setEditingTaskText(e.target.value)}
                    className="flex-grow bg-slate-700 rounded-md p-2 outline-none"
                  />
                  <button onClick={() => handleSaveEdit(task.id)} className="ml-2 p-2 hover:bg-slate-700 rounded-full">
                    <Save className="h-5 w-5 text-green-400" />
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id)}
                    className="h-6 w-6 rounded-md mr-4"
                  />
                  <p className={`flex-grow ${task.completed ? "line-through text-slate-400" : ""}`}>
                    {task.text}
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleStartEditing(task)} className="p-2 hover:bg-slate-700 rounded-full">
                      <Edit3 className="h-5 w-5 text-yellow-400" />
                    </button>
                    <button onClick={() => handleDeleteTask(task.id)} className="p-2 hover:bg-slate-700 rounded-full">
                      <Trash2 className="h-5 w-5 text-red-400" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))
        ) : (
          <p className="text-center text-gray-500">No tasks for this day. Time to relax! 🌴</p>
        )}
      </ul>
      
      {/* REFACTORED: Footer with semantic tags */}
      <footer className="text-center mt-12 p-8 border-t">
        <p className="text-4xl leading-tight font-bold">Crafted <br /> with love ❤️</p>
        <p className="text-lg mt-4">by Vishvas Gupta</p>
      </footer>
    </div>
  );
}

export default HabitualCalendar;