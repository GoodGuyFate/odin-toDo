import { ProjectService } from "./projectService.js";

/**
 * Orchestrates the application state, managing projects, tags,
 * and color palettes for the UI.
 */
class ProjectManager {
  constructor() {
    this.projects = [];
    this.currentProject = null;
    this.tags = [{ name: "Personal", color: "#fff9c4" }];
    // Hand picked colors to ensure a cohesive "Sticky Note" aesthetic
    this.pastelPalette = [
      "#f3d1b0",
      "#d0f4de",
      "#a9def9",
      "#e4c1f9",
      "#cfbaf0",
      "#b9fbc0",
    ];
  }

  getAllTags() {
    return this.tags;
  }

  /**
   * Selects a color from the predefined palette, falling back
   * to a randomized HSL pastel if the palette is exhausted.
   */
  getNextAvailableColor() {
    const usedColors = this.tags.map((t) => t.color);

    const availableFromPalette = this.pastelPalette.find(
      (c) => !usedColors.includes(c),
    );
    if (availableFromPalette) return availableFromPalette;

    let newColor;
    let attempts = 0;
    do {
      const hue = Math.floor(Math.random() * 360);
      newColor = `hsl(${hue}, 70%, 90%)`;
      attempts++;
    } while (usedColors.includes(newColor) && attempts < 20);

    return newColor;
  }

  // Registers a new tag category and assigns a unique pastel color
  addTag(name) {
    const sanitizedName = name.trim();
    if (
      !this.tags.find(
        (t) => t.name.toLowerCase() === sanitizedName.toLowerCase(),
      )
    ) {
      const color = this.getNextAvailableColor();
      this.tags.push({ name: sanitizedName, color });
    }
  }

  // Removes a tag and resets any orphaned notes to the "Personal" category
  deleteTag(tagName) {
    if (tagName === "Personal" || tagName === "All") return;

    this.tags = this.tags.filter((t) => t.name !== tagName);

    this.projects.forEach((p) => {
      if (p.todos[0]?.tag === tagName) {
        p.todos[0].tag = "Personal";
      }
    });
  }

  getTagColor(tagName) {
    const tag = this.tags.find((t) => t.name === tagName);
    return tag ? tag.color : "#fff9c4";
  }

  // Filters projects based on their primary todo's tag
  filterProjects(predicate) {
    return this.projects.filter(predicate);
  }

  addTodoToCurrent(todo) {
    if (this.currentProject) {
      this.currentProject.addTodo(todo);
    }
  }

  addProject(project) {
    this.projects.push(project);
  }

  // Delegates project array manipulation to the Service Layer and handles focus transitions
  deleteProject(id) {
    this.projects = ProjectService.removeProjectFromList(this.projects, id);

    if (this.currentProject?.uuid === id) {
      this.currentProject = this.projects[0] || null;
    }
  }

  getProjectById(id) {
    return this.projects.find((p) => p.uuid === id);
  }

  setCurrentProject(id) {
    const project = this.getProjectById(id);
    if (project) {
      this.currentProject = project;
    }
  }

  getAllProjects() {
    return this.projects;
  }
}

export const projectManager = new ProjectManager();
