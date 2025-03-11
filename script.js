document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

  // ======================
  // Constants and Variables
  // ======================
  const DOM = {
    addTaskBtn: document.querySelector(".add-task"),
    scheduleTaskBtn: document.querySelector(".schedule-task"),
    pomodoroBtn: document.querySelector(".pomodoro"),
    startBtn: document.querySelector(".start-btn"),
    pauseBtn: document.querySelector(".pause-btn"),
    resetBtn: document.querySelector(".reset-btn"),
    backBtn: document.querySelector(".back-btn"),
    durationTabs: document.querySelectorAll(".duration-tab"),
    customDurationInput: document.querySelector("#custom-duration"),
    setCustomDurationBtn: document.querySelector("#set-custom-duration"),
    timerDisplay: document.querySelector(".timer"),
    circleProgress: document.querySelector(".circle-progress"),
    kanbanContainer: document.querySelector(".kanban-container"),
    pomodoroContainer: document.querySelector(".pomodoro-container"),
    taskCreationModal: document.querySelector("#task-creation-modal"),
    taskCreationForm: document.querySelector("#task-creation-form"),
    subTasksContainer: document.querySelector("#sub-tasks-container"),
    addSubTaskBtn: document.querySelector("#add-sub-task"),
    profileModal: document.querySelector("#profile-modal"),
    taskModal: document.querySelector(".task-modal"),
    closeDetailsBtn: document.querySelector(".close-details"),
    progressFill: document.querySelector(".progress-fill"),
    progressText: document.querySelector(".progress-text"),
    xpDisplay: document.querySelector(".gems"),
    levelDisplay: document.querySelector(".level"),
    habitTracker: document.querySelector(".habit-tracker"),
    addHabitBtn: document.querySelector(".add-habit"),
    aiSuggestions: document.querySelector(".ai-suggestions"),
    acceptSuggestionBtn: document.querySelector(".accept-suggestion"),
    rejectSuggestionBtn: document.querySelector(".reject-suggestion"),
    focusMusicModal: document.querySelector("#focus-music-modal"),
    musicOptions: document.querySelectorAll(".music-option"),
    analytics: document.querySelector(".analytics"),
    toggleModeBtn: document.querySelector(".toggle-mode")
  };

  let timer;
  let timeLeft = 1500; // Default to 25 minutes
  let isRunning = false;
  let xp = 0; // Initial XP
  let level = 1; // Initial level
  let selectedDuration = 1500; // Track the currently selected duration
  let streak = 0; // Streak counter
  let habits = []; // Array to store habits
  let focusMusic = null; // Focus music audio object

  // ======================
  // Helper Functions
  // ======================
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const toggleMode = () => {
    document.body.classList.toggle("light-mode");
    if (DOM.toggleModeBtn) {
      DOM.toggleModeBtn.textContent = document.body.classList.contains("light-mode")
        ? "☀️"
        : "🌙";
    }
  };

  const updateXpDisplay = () => {
    if (DOM.xpDisplay) {
      DOM.xpDisplay.textContent = `💎 XP: ${xp}`;
    }
  };

  const updateLevelDisplay = () => {
    if (DOM.levelDisplay) {
      DOM.levelDisplay.textContent = `⭐ Level: ${level}`;
    }
  };

  const awardXp = (amount) => {
    xp += amount;
    if (xp >= level * 100) {
      level++;
      xp = 0;
      alert(`Level Up! You're now Level ${level}`);
    }
    updateXpDisplay();
    updateLevelDisplay();
  };

  const updateProgress = () => {
    const totalTasks = document.querySelectorAll(".task").length;
    const completedTasks = document.querySelectorAll("#done .task").length;
    const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    if (DOM.progressFill) {
      DOM.progressFill.style.width = `${progress}%`;
    }
    if (DOM.progressText) {
      DOM.progressText.textContent = `${progress}% Complete`;
    }
  };

  const updateStreak = () => {
    const lastCompletedDate = localStorage.getItem("lastCompletedDate");
    const today = new Date().toDateString();
    if (lastCompletedDate === today) return;
    if (lastCompletedDate && new Date(today) - new Date(lastCompletedDate) === 86400000) {
      streak++;
      awardXp(streak * 5); // Bonus XP for streaks
    } else {
      streak = 1;
    }
    localStorage.setItem("lastCompletedDate", today);
  };

  // ======================
  // Pomodoro Timer
  // ======================
  const startTimer = () => {
    if (!isRunning) {
      isRunning = true;
      timer = setInterval(() => {
        if (timeLeft > 0) {
          timeLeft--;
          updateTimerDisplay();
        } else {
          clearInterval(timer);
          if (DOM.timerDisplay) {
            DOM.timerDisplay.classList.add("shake");
          }
          alert("Time's up! Take a break.");
          isRunning = false;
        }
      }, 1000);
    }
  };

  const pauseTimer = () => {
    clearInterval(timer);
    isRunning = false;
  };

  const resetTimer = () => {
    clearInterval(timer);
    timeLeft = selectedDuration;
    isRunning = false;
    updateTimerDisplay();
    if (DOM.timerDisplay) {
      DOM.timerDisplay.classList.remove("shake");
    }
  };

  const updateTimerDisplay = () => {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const seconds = (timeLeft % 60).toString().padStart(2, "0");
    if (DOM.timerDisplay) {
      DOM.timerDisplay.textContent = `${minutes}:${seconds}`;
    }
    const progressPercentage = ((timeLeft / selectedDuration) * 100).toFixed(2);
    if (DOM.circleProgress) {
      DOM.circleProgress.style.background = `conic-gradient(#ff9f1c ${progressPercentage}%, transparent ${progressPercentage}%)`;
    }
  };

  // ======================
  // Task Management
  // ======================
  const createTask = (taskName, taskPriority, taskDeadline, subTasks) => {
    const task = document.createElement("div");
    task.classList.add("task");
    task.dataset.priority = taskPriority;
    task.dataset.deadline = taskDeadline;
    task.dataset.created = Date.now();
    task.dataset.subTasks = JSON.stringify(subTasks);
    task.style.borderLeft = `5px solid ${
      taskPriority === "high" ? "#ff4757" : taskPriority === "medium" ? "#ffa502" : "#2ed573"
    }`;
    const taskContent = document.createElement("div");
    taskContent.className = "task-content";
    taskContent.innerHTML = `
      <input type="checkbox" class="task-checkbox">
      <span class="task-name">${taskName}</span>
      <button class="details-btn">🔍</button>
    `;
    task.append(taskContent);
    document.querySelector("#backlog .task-list").appendChild(task);
    task.querySelector(".task-checkbox").addEventListener("change", () => moveTask(task));
    task.querySelector(".details-btn").addEventListener("click", () => showTaskDetails(task));
    updateProgress();
  };

  const moveTask = (task) => {
    const doingColumn = document.querySelector("#doing .task-list");
    const doneColumn = document.querySelector("#done .task-list");
    if (task.parentElement.parentElement.id === "backlog") {
      if (doingColumn.children.length >= 1) {
        alert("Complete your current task first! ADHD-friendly limitation.");
        task.querySelector(".task-checkbox").checked = false;
        return;
      }
      doingColumn.appendChild(task);
    } else if (task.parentElement.parentElement.id === "doing") {
      doneColumn.appendChild(task);
      task.querySelector(".task-checkbox").remove();
      awardXp(10);
      updateStreak();
    }
    updateProgress();
  };

  const showTaskDetails = (task) => {
    if (DOM.taskModal) {
      const existingSubTasksDetails = DOM.taskModal.querySelector(".sub-tasks-details");
      if (existingSubTasksDetails) {
        existingSubTasksDetails.remove();
      }
      DOM.taskModal.querySelector(".detail-priority").textContent =
        task.dataset.priority || "Not set";
      DOM.taskModal.querySelector(".detail-deadline").textContent =
        task.dataset.deadline || "No deadline";
      DOM.taskModal.querySelector(".detail-created").textContent =
        new Date(parseInt(task.dataset.created)).toLocaleString();
      const subTasksDiv = document.createElement("div");
      subTasksDiv.className = "sub-tasks-details";
      subTasksDiv.innerHTML = "<h4>Sub-Tasks:</h4>";
      const subTasks = task.dataset.subTasks ? JSON.parse(task.dataset.subTasks) : [];
      subTasks.forEach((subTask) => {
        const subTaskItem = document.createElement("div");
        subTaskItem.className = "sub-task-item";
        subTaskItem.innerHTML = `
          <input type="checkbox" class="sub-task-checkbox">
          <span>${subTask}</span>
        `;
        subTasksDiv.appendChild(subTaskItem);
      });
      DOM.taskModal.querySelector(".task-details").appendChild(subTasksDiv);
      DOM.taskModal.style.display = "flex";
    }
  };

  // ======================
  // Habit Tracker
  // ======================
  const addHabit = () => {
    const habitName = prompt("Enter a new habit:");
    if (habitName) {
      const habit = document.createElement("div");
      habit.className = "habit";
      habit.innerHTML = `
        <input type="checkbox" id="habit${habits.length + 1}">
        <label for="habit${habits.length + 1}">${habitName}</label>
      `;
      DOM.habitTracker.querySelector(".habit-list").appendChild(habit);
      habits.push(habitName);
    }
  };

  // ======================
  // AI Suggestions
  // ======================
  const generateSuggestion = () => {
    const suggestions = ["Write a report", "Design a logo", "Plan a meeting"];
    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    DOM.aiSuggestions.querySelector(".suggestion-text").textContent = suggestion;
  };

  const acceptSuggestion = () => {
    const suggestion = DOM.aiSuggestions.querySelector(".suggestion-text").textContent;
    if (suggestion) {
      createTask(suggestion, "medium", new Date().toISOString(), []);
      generateSuggestion();
    }
  };

  const rejectSuggestion = () => {
    generateSuggestion();
  };

  // ======================
  // Focus Music
  // ======================
  const playFocusMusic = (src) => {
    if (focusMusic) {
      focusMusic.pause();
    }
    focusMusic = new Audio(src);
    focusMusic.loop = true;
    focusMusic.play();
  };

  // ======================
  // Analytics
  // ======================
  const renderProductivityChart = () => {
    const ctx = DOM.analytics.querySelector("#productivityChart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Tasks Completed",
            data: [5, 7, 3, 8, 6, 4, 9],
            borderColor: "#ff9f1c"
          }
        ]
      }
    });
  };

  // ======================
  // Event Listeners
  // ======================
  if (DOM.toggleModeBtn) {
    DOM.toggleModeBtn.addEventListener("click", toggleMode);
  }
  if (DOM.startBtn) DOM.startBtn.addEventListener("click", startTimer);
  if (DOM.pauseBtn) DOM.pauseBtn.addEventListener("click", pauseTimer);
  if (DOM.resetBtn) DOM.resetBtn.addEventListener("click", resetTimer);
  if (DOM.durationTabs) {
    DOM.durationTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        DOM.durationTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        selectedDuration = parseInt(tab.dataset.duration);
        timeLeft = selectedDuration;
        updateTimerDisplay();
      });
    });
  }
  if (DOM.setCustomDurationBtn) {
    DOM.setCustomDurationBtn.addEventListener("click", () => {
      const customMinutes = parseInt(DOM.customDurationInput.value);
      if (isNaN(customMinutes) || customMinutes < 5 || customMinutes > 120) {
        alert("Please enter a duration between 5 and 120 minutes.");
        return;
      }
      selectedDuration = customMinutes * 60;
      timeLeft = selectedDuration;
      DOM.durationTabs.forEach(t => t.classList.remove("active"));
      updateTimerDisplay();
    });
  }
  if (DOM.addTaskBtn) {
    DOM.addTaskBtn.addEventListener("click", () => {
      if (DOM.taskCreationModal) {
        DOM.taskCreationModal.style.display = "flex";
      }
    });
  }
  if (DOM.scheduleTaskBtn) {
    DOM.scheduleTaskBtn.addEventListener("click", () => {
      alert("Schedule Task feature is under development!");
    });
  }
  if (DOM.pomodoroBtn) {
    DOM.pomodoroBtn.addEventListener("click", () => {
      if (DOM.kanbanContainer && DOM.pomodoroContainer) {
        DOM.kanbanContainer.style.display = "none";
        DOM.pomodoroContainer.classList.add("active");
      }
    });
  }
  if (DOM.backBtn) {
    DOM.backBtn.addEventListener("click", () => {
      if (DOM.kanbanContainer && DOM.pomodoroContainer) {
        DOM.kanbanContainer.style.display = "block";
        DOM.pomodoroContainer.classList.remove("active");
      }
    });
  }
  if (DOM.addSubTaskBtn) {
    DOM.addSubTaskBtn.addEventListener("click", () => {
      const subTaskDiv = document.createElement("div");
      subTaskDiv.className = "sub-task";
      subTaskDiv.innerHTML = `
        <input type="text" class="sub-task-input" placeholder="Enter sub-task" />
        <button type="button" class="remove-sub-task">🗑️</button>
      `;
      DOM.subTasksContainer.appendChild(subTaskDiv);
      subTaskDiv.querySelector(".remove-sub-task").addEventListener("click", () => {
        subTaskDiv.remove();
      });
    });
  }
  if (DOM.taskCreationForm) {
    DOM.taskCreationForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const taskName = DOM.taskCreationForm.querySelector("#task-name").value;
      const taskPriority = DOM.taskCreationForm.querySelector("#task-priority").value;
      const taskDeadline = DOM.taskCreationForm.querySelector("#task-deadline").value;
      const subTasks = Array.from(DOM.subTasksContainer.querySelectorAll(".sub-task-input"))
        .map(input => input.value.trim())
        .filter(task => task !== "");
      if (!taskName || !taskPriority || !taskDeadline) {
        alert("Please fill in all required fields.");
        return;
      }
      createTask(taskName, taskPriority, taskDeadline, subTasks);
      DOM.taskCreationModal.style.display = "none";
      DOM.taskCreationForm.reset();
      DOM.subTasksContainer.innerHTML = `<div class="sub-task">
        <input type="text" class="sub-task-input" placeholder="Enter sub-task" />
        <button type="button" class="remove-sub-task">🗑️</button>
      </div>`;
      const defaultRemoveBtn = DOM.subTasksContainer.querySelector(".remove-sub-task");
      if (defaultRemoveBtn) {
        defaultRemoveBtn.addEventListener("click", () => {
          defaultRemoveBtn.parentElement.remove();
        });
      }
    });
  }
  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (DOM.taskCreationModal) {
        DOM.taskCreationModal.style.display = "none";
      }
      if (DOM.profileModal) {
        DOM.profileModal.style.display = "none";
      }
      if (DOM.focusMusicModal) {
        DOM.focusMusicModal.style.display = "none";
      }
    });
  });
  if (DOM.closeDetailsBtn) {
    DOM.closeDetailsBtn.addEventListener("click", () => {
      if (DOM.taskModal) {
        DOM.taskModal.style.display = "none";
      }
    });
  }
  if (DOM.addHabitBtn) {
    DOM.addHabitBtn.addEventListener("click", addHabit);
  }
  if (DOM.acceptSuggestionBtn) {
    DOM.acceptSuggestionBtn.addEventListener("click", acceptSuggestion);
  }
  if (DOM.rejectSuggestionBtn) {
    DOM.rejectSuggestionBtn.addEventListener("click", rejectSuggestion);
  }
  if (DOM.musicOptions) {
    DOM.musicOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const src = option.dataset.src;
        playFocusMusic(src);
        DOM.focusMusicModal.style.display = "none";
      });
    });
  }
  // --- Profile Modal Fix ---
  const profileBtn = document.getElementById("profile-btn");
  if (profileBtn && DOM.profileModal) {
    profileBtn.addEventListener("click", () => {
      DOM.profileModal.style.display = "flex";
    });
  }
  // --------------------------
  updateXpDisplay();
  updateLevelDisplay();
  updateProgress();
  generateSuggestion();
  renderProductivityChart();
  updateTimerDisplay();
});
