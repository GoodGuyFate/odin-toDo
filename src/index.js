import "./styles.css"
import { projectManager } from "./modules/projectManager.js";
import { ToDoObject } from "./modules/todo.js";
import { Project } from "./modules/project.js";



window.projectManager = projectManager;
window.Project = Project;
window.ToDoObject = ToDoObject;


projectManager.setupDefaultProject();

console.log("App initialized. You can now use 'projectManager' in the console.");