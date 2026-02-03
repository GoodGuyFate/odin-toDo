import "./styles.css"
import { projectManager } from "./modules/projectManager.js";
import { displayController } from "./modules/displayController.js";
import { ToDoObject } from "./modules/todo.js";
import { Project } from "./modules/project.js";


projectManager.setupDefaultProject();
displayController.init(); 
displayController.renderAll();

console.log("App initialized. You can now use 'projectManager' in the console.");