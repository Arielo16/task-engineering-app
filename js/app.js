const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const taskTemplate = document.getElementById('taskTemplate');
const formMessage = document.getElementById('formMessage');
const totalTasks = document.getElementById('totalTasks');
const pendingTasks = document.getElementById('pendingTasks');
const doneTasks = document.getElementById('doneTasks');

const storageKey = 'task-engineering-app.tasks';
let tasks = loadTasks();

function loadTasks() {
	try {
		const storedTasks = localStorage.getItem(storageKey);
		return storedTasks ? JSON.parse(storedTasks) : [];
	} catch {
		return [];
	}
}

function saveTasks() {
	localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function formatDate(dateString) {
	if (!dateString) {
		return 'Sin fecha límite';
	}

	const date = new Date(`${dateString}T00:00:00`);
	return new Intl.DateTimeFormat('es-ES', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(date);
}

function priorityLabel(priority) {
	return {
		alta: 'Alta prioridad',
		media: 'Prioridad media',
		baja: 'Prioridad baja',
	}[priority] || 'Prioridad media';
}

function setMessage(text, type = '') {
	formMessage.textContent = text;
	formMessage.classList.remove('is-error', 'is-success');

	if (type) {
		formMessage.classList.add(type);
	}
}

function updateStats() {
	const completed = tasks.filter((task) => task.completed).length;

	totalTasks.textContent = tasks.length;
	pendingTasks.textContent = tasks.length - completed;
	doneTasks.textContent = completed;
}

function renderEmptyState() {
	taskList.innerHTML = '';
	taskList.classList.add('is-empty');
	taskList.textContent = 'No hay tareas todavía. Usa el formulario para crear la primera.';
}

function renderTasks() {
	if (!tasks.length) {
		renderEmptyState();
		updateStats();
		return;
	}

	taskList.classList.remove('is-empty');
	taskList.innerHTML = '';

	tasks.forEach((task) => {
		const card = taskTemplate.content.firstElementChild.cloneNode(true);
		card.dataset.id = task.id;
		card.dataset.priority = task.priority;

		card.classList.toggle('is-complete', task.completed);

		card.querySelector('.task-card__title').textContent = task.title;
		card.querySelector('.task-card__meta').textContent = task.category || 'Sin categoría';
		card.querySelector('.task-card__description').textContent = task.description || 'Sin descripción adicional.';
		card.querySelector('.task-card__date').textContent = `Límite: ${formatDate(task.dueDate)}`;

		const priorityBadge = card.querySelector('.task-card__priority');
		priorityBadge.textContent = priorityLabel(task.priority);

		const toggleButton = card.querySelector('.task-toggle');
		toggleButton.textContent = task.completed ? 'Reabrir' : 'Completar';

		toggleButton.addEventListener('click', () => toggleTask(task.id));
		card.querySelector('.task-delete').addEventListener('click', () => deleteTask(task.id));

		taskList.appendChild(card);
	});

	updateStats();
}

function addTask(taskData) {
	tasks = [
		{
			id: crypto.randomUUID(),
			completed: false,
			...taskData,
		},
		...tasks,
	];

	saveTasks();
	renderTasks();
}

function toggleTask(taskId) {
	tasks = tasks.map((task) => (
		task.id === taskId
			? { ...task, completed: !task.completed }
			: task
	));

	saveTasks();
	renderTasks();
}

function deleteTask(taskId) {
	tasks = tasks.filter((task) => task.id !== taskId);
	saveTasks();
	renderTasks();
	setMessage('Tarea eliminada.', 'is-success');
}

taskForm.addEventListener('submit', (event) => {
	event.preventDefault();

	const title = document.getElementById('taskTitle').value.trim();
	const description = document.getElementById('taskDescription').value.trim();
	const priority = document.getElementById('taskPriority').value;
	const dueDate = document.getElementById('taskDueDate').value;
	const category = document.getElementById('taskCategory').value.trim();

	if (!title || !dueDate) {
		setMessage('Completa al menos el título y la fecha límite.', 'is-error');
		return;
	}

	addTask({
		title,
		description,
		priority,
		dueDate,
		category,
	});

	taskForm.reset();
	document.getElementById('taskPriority').value = 'media';
	setMessage('Tarea agregada correctamente.', 'is-success');
});

taskForm.addEventListener('reset', () => {
	setMessage('');
});

renderTasks();
