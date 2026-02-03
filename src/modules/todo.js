export class ToDoObject {
    constructor(title, description, dueDate, priority, options = {}) {
        this.title = title
        this.description = description
        this.dueDate = dueDate
        this.priority = priority

        this.checklist = options.checklist || []
        this.notes = options.notes || ""

        this.uuid = crypto.randomUUID()
    }
}