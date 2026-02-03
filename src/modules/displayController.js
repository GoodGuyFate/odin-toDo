import { projectManager } from "./projectManager.js";
import { ToDoObject } from "./todo.js";
import { Project } from "./project.js";

/**
 * Manages all DOM manipulation and UI state transitions
 */
export const displayController = {
  // Orchestrates a full refresh of all UI components
  renderAll() {
    this.renderTodoGrid();
    this.renderSidebar();
    this.updateTagDropdown();
  },

  // Clears and repopulates the main grid based on the selected tag filter
  renderTodoGrid(filterTag = "All") {
    const grid = document.getElementById("todo-grid");
    const titleHeader = document.getElementById("current-project-title");
    if (!grid) return;

    grid.replaceChildren();

    if (titleHeader) {
      titleHeader.textContent =
        filterTag === "All" ? "Sticky Wall" : `Sticky Wall - ${filterTag}`;
    }

    const projectsToShow = projectManager.getProjectsByTag(filterTag);
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
      <div class="card-header">
        <h3 class="todo-title-display"></h3>
        <span class="tag-pill"></span> 
      </div>
      <p class="card-desc"></p>
      <ul class="card-checklist"></ul>
    `,
    );

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
      };
      checklistContainer.appendChild(li);
    });

    return card;
  },

  // Populates the sidebar with system and user-defined project lists
  renderSidebar() {
    const sidebar = document.querySelector(".projects-section");
    if (!sidebar) return;

    sidebar.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Lists";
    sidebar.appendChild(heading);

    sidebar.appendChild(
      this.createSidebarItem({ name: "All", color: "#e0e0e0" }, false),
    );

    projectManager.getAllTags().forEach((tag) => {
      const isDeletable = tag.name !== "Personal";
      sidebar.appendChild(this.createSidebarItem(tag, isDeletable));
    });

    const addBtn = document.createElement("div");
    addBtn.className = "sidebar-item add-list-btn";
    addBtn.innerHTML = `<span>+</span> Add New List`;
    addBtn.onclick = () => {
      const name = prompt("Enter new list name:");
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

  // Initializes global event listeners and form submission logic
  init() {
    const form = document.getElementById("todo-form");
    const modal = document.getElementById("todo-modal");
    const closeBtn = document.getElementById("close-modal");

    if (!form || !modal || !closeBtn) return;

    closeBtn.onclick = () => modal.classList.add("hidden");

    form.onsubmit = (e) => {
      e.preventDefault();
      const title = document.getElementById("project-name").value;
      const description = document.getElementById("todo-notes").value;
      const checklistRaw = document.getElementById("first-todo").value;
      const selectedTag = document.getElementById("todo-tag").value;

      // Converts comma-separated string into structured checklist objects
      const checklistItems = checklistRaw
        .split(",")
        .filter((i) => i.trim())
        .map((text) => ({ text: text.trim(), completed: false }));

      const newProject = new Project(title);
      const mainContent = new ToDoObject(title, description, null, "medium", {
        checklist: checklistItems,
        tag: selectedTag,
      });

      newProject.addTodo(mainContent);
      projectManager.addProject(newProject);

      form.reset();
      modal.classList.add("hidden");
      this.renderAll();
    };
  },
};
