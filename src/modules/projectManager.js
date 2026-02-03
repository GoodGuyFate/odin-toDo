import { Project } from "./project.js";
import { ProjectService } from "./projectService.js";

class ProjectManager {
  constructor() {
    this.projects = [];
    this.currentProject = null;
    this.tags = [
      { name: "Personal", color: "#fff9c4" }, // Pastel Yellow
    ];
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

  getNextAvailableColor() {
    const usedColors = this.tags.map((t) => t.color);

    // 1. Try to pick from the high-quality hand-picked palette first
    const availableFromPalette = this.pastelPalette.find(
      (c) => !usedColors.includes(c),
    );
    if (availableFromPalette) return availableFromPalette;

    // 2. If palette is exhausted, generate a unique random pastel (HSL)
    let newColor;
    let attempts = 0;
    do {
      // Pastels live in high lightness (90%) and moderate saturation (70%)
      const hue = Math.floor(Math.random() * 360);
      newColor = `hsl(${hue}, 70%, 90%)`;
      attempts++;
    } while (usedColors.includes(newColor) && attempts < 20);

    return newColor;
  }

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

  getProjectsByTag(tagName) {
    if (tagName === "All") return this.projects;
    return this.projects.filter((p) => p.todos[0]?.tag === tagName);
  }

  addTodoToCurrent(todo) {
    if (this.currentProject) {
      this.currentProject.addTodo(todo);
    }
  }

  setupDefaultProject() {
    if (this.projects.length === 0) {
      const home = new Project("Home");
      this.addProject(home);
      this.currentProject = home;
    }
  }

  addProject(project) {
    this.projects.push(project);
  }

  deleteProject(id) {
    this.projects = this.projects.filter((p) => p.uuid !== id);

    if (this.currentProject?.uuid === id) {
      this.currentProject = this.projects[0] || null;
    }

    if (this.projects.length === 0) {
      this.setupDefaultProject();
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
