export const ProjectService = {
    addTodoToProject(project, todoObject) {
        project.todos.push(todoObject)
    },

    removeTodoFromProject(project, todoId) {
        project.todos = project.todos.filter(todo => todo.uuid !== todoId)
    },

    toggleChecklistItem(todo, index) {
        if (todo.checklist[index]) {
            todo.checklist[index].completed = !todo.checklist[index].completed
        }
    }
}