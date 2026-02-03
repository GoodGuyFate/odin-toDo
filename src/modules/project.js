export class Project {
    constructor(name) {
        this.name = name
        this.todos = []
        this.uuid = crypto.randomUUID()
    }

    addTodo(todo) {
        this.todos.push(todo);
    }
}