import { projectManager } from "./projectManager.js";
import { ToDoObject } from "./todo.js";
import { Project } from "./project.js";

export const displayController = {
  renderAll() {
    this.renderTodoGrid();
    this.renderSidebar();
    this.updateTagDropdown();
  },

  renderTodoGrid(filterTag = "All") {
    const grid = document.getElementById("todo-grid");
    const titleHeader = document.getElementById("current-project-title");
    if (!grid) return;

    grid.innerHTML = "";
    if (titleHeader) {
      titleHeader.textContent =
        filterTag === "All" ? "Sticky Wall" : `Sticky Wall - ${filterTag}`;
    }

    const projectsToShow = projectManager.getProjectsByTag(filterTag);
    projectsToShow.sort((a, b) => a.name.localeCompare(b.name));

    projectsToShow.forEach((project) => {
      const stickyNoteData = project.todos[0];
      if (stickyNoteData) {
        const card = this.createTodoCard(stickyNoteData);
        grid.appendChild(card);
      }
    });

    grid.appendChild(this.createAddCard());
  },

  createTodoCard(todo) {
    const card = document.createElement("div");
    card.classList.add("todo-card");
    // Sync background with the tag's pastel color
    card.style.backgroundColor = projectManager.getTagColor(todo.tag);

    card.innerHTML = `
      <div class="card-header">
        <h3>${todo.title}</h3>
        ${todo.tag ? `<span class="tag-pill">${todo.tag}</span>` : ""}
      </div>
      <p class="card-desc">${todo.description || ""}</p>
      <ul class="card-checklist">
        ${(todo.checklist || [])
          .map(
            (item, index) => `
          <li data-index="${index}" class="${item.completed ? "completed" : ""}">
            ${item.text}
          </li>
        `,
          )
          .join("")}
      </ul>
    `;

    const listItems = card.querySelectorAll(".card-checklist li");
    listItems.forEach((li) => {
      li.onclick = (e) => {
        e.stopPropagation();
        const index = li.getAttribute("data-index");
        todo.checklist[index].completed = !todo.checklist[index].completed;
        li.classList.toggle("completed");
      };
    });

    return card;
  },

  renderSidebar() {
    const sidebar = document.querySelector(".projects-section");
    if (!sidebar) return;
    sidebar.innerHTML = `<h3>Lists</h3>`;

    // 1. All Filter
    sidebar.appendChild(
      this.createSidebarItem({ name: "All", color: "#e0e0e0" }, false),
    );

    // 2. Dynamic Tags
    projectManager.getAllTags().forEach((tag) => {
      // Only allow deletion if the tag is NOT named "Personal"
      const isDeletable = tag.name !== "Personal";
      sidebar.appendChild(this.createSidebarItem(tag, isDeletable));
    });

    // 3. Automated Add List Button
    const addBtn = document.createElement("div");
    addBtn.className = "sidebar-item add-list-btn";
    addBtn.innerHTML = `<span>+</span> Add New List`;
    addBtn.onclick = () => {
      const name = prompt("Enter new list name:");
      if (name) {
        projectManager.addTag(name); // Color is assigned automatically now!
        this.renderAll();
      }
    };
    sidebar.appendChild(addBtn);
  },

  createSidebarItem(tag, canDelete) {
    const div = document.createElement("div");
    div.className = "sidebar-item";
    div.innerHTML = `
      <span style="background-color: ${tag.color}"></span>
      <p>${tag.name}</p>
      ${canDelete ? `<button class="delete-tag-btn">×</button>` : ""}
    `;

    div.onclick = () => this.renderTodoGrid(tag.name);

    if (canDelete) {
      div.querySelector(".delete-tag-btn").onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Delete tag "${tag.name}"?`)) {
          projectManager.deleteTag(tag.name);
          this.renderAll();
        }
      };
    }
    return div;
  },

  updateTagDropdown() {
    const select = document.getElementById("todo-tag");
    if (!select) return;
    select.innerHTML = projectManager
      .getAllTags()
      .map((tag) => `<option value="${tag.name}">${tag.name}</option>`)
      .join("");
  },

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
