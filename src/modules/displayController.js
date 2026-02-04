import { projectManager } from "./projectManager.js";
import { ToDoObject } from "./todo.js";
import { Project } from "./project.js";

/**
 * Manages all DOM manipulation and UI state transitions
 */
export const displayController = {
  currentFilterTag: "All",
  currentSearchQuery: "",
  editingProjectId: null,

  // Orchestrates a full refresh of all UI components
  renderAll() {
    // Reset search on full render or keep it based on preference
    const searchInput = document.getElementById("project-search");
    const query = searchInput ? searchInput.value : "";

    this.renderTodoGrid(this.currentFilterTag, query);
    this.renderSidebar();
    this.updateTagDropdown();
  },

  // Clears and repopulates the main grid based on the selected tag filter
  renderTodoGrid(filterTag = "All", searchQuery = "") {
    const grid = document.getElementById("todo-grid");
    const titleHeader = document.getElementById("current-project-title");
    if (!grid) return;

    // Update internal state
    this.currentFilterTag = filterTag;
    this.currentSearchQuery = searchQuery;

    grid.replaceChildren();

    if (titleHeader) {
      titleHeader.textContent =
        filterTag === "All" ? "Sticky Wall" : `Sticky Wall - ${filterTag}`;
    }

    const filterCriteria = (project) => {
      // Check Tag Match
      const matchesTag =
        filterTag === "All" ||
        project.todos.some((todo) => todo.tag === filterTag);

      const title = project.name.toLowerCase();
      // Accessing the first todo's description for the search
      const desc = project.todos[0]?.description.toLowerCase() || "";
      const query = searchQuery.toLowerCase();

      const matchesSearch = title.includes(query) || desc.includes(query);

      return matchesTag && matchesSearch;
    };

    const projectsToShow = projectManager.filterProjects(filterCriteria);
    projectsToShow.sort((a, b) => a.name.localeCompare(b.name));

    projectsToShow.forEach((project) => {
      const stickyNoteData = project.todos[0];
      if (stickyNoteData) {
        const card = this.createTodoCard(stickyNoteData, project.uuid);
        grid.appendChild(card);
      }
    });

    grid.appendChild(this.createAddCard());
  },

  // Builds the sticky note DOM structure using safe textContent to prevent XSS
  createTodoCard(todo, projectId) {
    const card = document.createElement("div");
    card.classList.add("todo-card");
    card.style.backgroundColor = projectManager.getTagColor(todo.tag);

    const editBtn = document.createElement("button");
    editBtn.className = "card-edit-btn";
    editBtn.textContent = "✎";
    editBtn.onclick = (e) => {
      e.stopPropagation();
      this.openEditModal(projectId);
    };
    card.appendChild(editBtn);

    // Delete button allows project removal via the manager
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "card-delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Delete "${todo.title}"?`)) {
        projectManager.deleteProject(projectId);
        this.renderAll();
      }
    };
    card.appendChild(deleteBtn);

    // Skeleton structure injected before filling with sensitive user data
    card.insertAdjacentHTML(
      "beforeend",
      `
      <div class="priority-stripe ${todo.priority}"></div>
      <div class="card-header">
        <h3 class="todo-title-display"></h3>
        <span class="tag-pill"></span> 
      </div>
      <p class="card-desc"></p>
      <ul class="card-checklist"></ul>
      <div class="card-footer">
        <span class="due-date-display"></span>
      </div>
    `,
    );

    const dateDisplay = card.querySelector(".due-date-display");
    if (todo.dueDate) {
      const formattedDate = new Date(todo.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      dateDisplay.textContent = `📅 ${formattedDate}`;
    } else {
      dateDisplay.remove();
    }

    card.querySelector(".todo-title-display").textContent = todo.title;

    const tagPill = card.querySelector(".tag-pill");
    if (todo.tag) {
      tagPill.textContent = todo.tag;
    } else {
      tagPill.remove();
    }

    card.querySelector(".card-desc").textContent = todo.description || "";

    // Generate checklist items with individual toggle listeners
    const checklistContainer = card.querySelector(".card-checklist");
    (todo.checklist || []).forEach((item, index) => {
      const li = document.createElement("li");
      li.textContent = item.text;
      if (item.completed) li.classList.add("completed");

      li.onclick = (e) => {
        e.stopPropagation();
        item.completed = !item.completed;
        li.classList.toggle("completed");
        projectManager.saveToLocalStorage();
      };
      checklistContainer.appendChild(li);
    });

    return card;
  },

  // Populates the sidebar with system and user defined project tags
  renderSidebar() {
    const sidebar = document.querySelector(".projects-section");
    if (!sidebar) return;

    sidebar.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Tags";
    sidebar.appendChild(heading);

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search tags...";
    searchInput.className = "tag-search-bar";
    sidebar.appendChild(searchInput);

    const tagsContainer = document.createElement("div");
    tagsContainer.className = "tags-scroll-container";
    sidebar.appendChild(tagsContainer);

    // Function to actually draw the tags (we'll call this initially and on input)
    const drawTags = (filterText = "") => {
      tagsContainer.replaceChildren();

      const allTags = [
        { name: "All", color: "#e0e0e0" },
        ...projectManager.getAllTags(),
      ];

      allTags.forEach((tag) => {
        // Only show tags that match the search text
        if (tag.name.toLowerCase().includes(filterText.toLowerCase())) {
          const isDeletable = tag.name !== "Personal" && tag.name !== "All";
          tagsContainer.appendChild(this.createSidebarItem(tag, isDeletable));
        }
      });
    };

    searchInput.oninput = (e) => {
      drawTags(e.target.value);
    };

    drawTags();

    const addBtn = document.createElement("div");
    addBtn.className = "sidebar-item add-list-btn";
    addBtn.innerHTML = `<span>+</span> Add New Tag`;
    addBtn.onclick = () => {
      const name = prompt("Enter new tag name:");
      if (name && name.trim()) {
        projectManager.addTag(name.trim());
        this.renderAll();
      }
    };
    sidebar.appendChild(addBtn);
  },

  // Helper to build individual sidebar navigation items
  createSidebarItem(tag, canDelete) {
    const div = document.createElement("div");
    div.className = "sidebar-item";

    const colorSpan = document.createElement("span");
    colorSpan.style.backgroundColor = tag.color;

    const nameP = document.createElement("p");
    nameP.textContent = tag.name;

    div.appendChild(colorSpan);
    div.appendChild(nameP);

    if (canDelete) {
      const delBtn = document.createElement("button");
      delBtn.className = "delete-tag-btn";
      delBtn.textContent = "×";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Delete tag "${tag.name}"?`)) {
          projectManager.deleteTag(tag.name);
          this.renderAll();
        }
      };
      div.appendChild(delBtn);
    }

    div.onclick = () => this.renderTodoGrid(tag.name);
    return div;
  },

  // Synchronizes the modal's dropdown with the current list of tags
  updateTagDropdown() {
    const select = document.getElementById("todo-tag");
    if (!select) return;

    select.replaceChildren();
    projectManager.getAllTags().forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag.name;
      option.textContent = tag.name;
      select.appendChild(option);
    });
  },

  // Creates the persistent placeholder card used to trigger the "New Todo" modal
  createAddCard() {
    const card = document.createElement("div");
    card.classList.add("todo-card", "add-card");
    card.innerHTML = `<span>+</span>`;
    card.onclick = () => {
      this.updateTagDropdown();
      document.getElementById("todo-modal").classList.remove("hidden");
    };
    return card;
  },

  openEditModal(projectId) {
    const project = projectManager.getProjectById(projectId);
    const todo = project.todos[0];

    this.editingProjectId = projectId; // Track which one we are editing

    // Fill the form with existing data
    document.getElementById("project-name").value = todo.title;
    document.getElementById("todo-notes").value = todo.description;
    document.getElementById("todo-tag").value = todo.tag;
    document.getElementById("todo-date").value = todo.dueDate || "";
    document.getElementById("todo-priority").value = todo.priority;

    // Convert checklist objects back to a comma-separated string for the input
    document.getElementById("first-todo").value = todo.checklist
      .map((item) => item.text)
      .join(", ");

    document.querySelector("#todo-modal h2").textContent = "Edit Sticky Note";
    document.getElementById("todo-modal").classList.remove("hidden");
  },

  // Initializes global event listeners and form submission logic
  init() {
    const form = document.getElementById("todo-form");
    const modal = document.getElementById("todo-modal");
    const closeBtn = document.getElementById("close-modal");
    const projectSearch = document.getElementById("project-search");

    if (!form || !modal || !closeBtn || !projectSearch) return;

    // Handle closing the modal
    closeBtn.onclick = () => {
      modal.classList.add("hidden");
      this.editingProjectId = null; // Reset state so next open is "New"
      form.reset();
    };

    // Handle project search
    projectSearch.oninput = (e) => {
      this.renderTodoGrid(this.currentFilterTag, e.target.value);
    };

    form.onsubmit = (e) => {
      e.preventDefault();

      // 1. Gather all form values
      const title = document.getElementById("project-name").value;
      const description = document.getElementById("todo-notes").value;
      const checklistRaw = document.getElementById("first-todo").value;
      const selectedTag = document.getElementById("todo-tag").value;
      const dueDate = document.getElementById("todo-date").value;
      const priority = document.getElementById("todo-priority").value;

      const checklistItems = checklistRaw
        .split(",")
        .filter((i) => i.trim())
        .map((text) => ({ text: text.trim(), completed: false }));

      // 2. Determine if we are EDITING or CREATING
      if (this.editingProjectId) {
        // --- EDIT MODE ---
        const project = projectManager.getProjectById(this.editingProjectId);
        const todo = project.todos[0];

        // Update the existing objects in memory
        project.name = title;
        todo.title = title;
        todo.description = description;
        todo.dueDate = dueDate || null;
        todo.priority = priority;
        todo.tag = selectedTag;
        todo.checklist = checklistItems;

        // Sync changes and reset the editing flag
        projectManager.saveToLocalStorage();
        this.editingProjectId = null;
      } else {
        // --- CREATE MODE ---
        const newProject = new Project(title);
        const mainContent = new ToDoObject(
          title,
          description,
          dueDate || null,
          priority,
          {
            checklist: checklistItems,
            tag: selectedTag,
          },
        );

        newProject.addTodo(mainContent);
        projectManager.addProject(newProject);
      }

      // 3. Cleanup and Refresh UI
      form.reset();
      document.querySelector("#todo-modal h2").textContent = "New Sticky Note";
      modal.classList.add("hidden");

      projectSearch.value = ""; // Clear search so the updated/new note is visible
      this.renderAll();
    };
  },
};
