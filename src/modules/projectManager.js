import { Project } from "./project.js";
import { ProjectService } from "./projectService.js";

class ProjectManager {
  constructor() {
    this.projects = [];
    this.currentProject = null;
  }

  addTodoToCurrent(todo) {
    if (this.currentProject) {
      ProjectService.addTodoToProject(this.currentProject, todo);
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
