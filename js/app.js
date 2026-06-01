const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const taskTemplate = document.getElementById('taskTemplate');
const formMessage = document.getElementById('formMessage');
const totalTasks = document.getElementById('totalTasks');
const pendingTasks = document.getElementById('pendingTasks');
const doneTasks = document.getElementById('doneTasks');
const taskModal = document.getElementById('taskModal');
const deleteModal = document.getElementById('deleteModal');
const taskModalTitle = document.getElementById('taskModalTitle');
const saveTaskButton = document.getElementById('saveTaskButton');
const deleteTaskName = document.getElementById('deleteTaskName');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');
const openTaskModalButton = document.getElementById('openTaskModalButton');
const clearFiltersButton = document.getElementById('clearFiltersButton');
const taskSearch = document.getElementById('taskSearch');
const taskStatusFilter = document.getElementById('taskStatusFilter');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescriptionInput = document.getElementById('taskDescription');
const taskPriorityInput = document.getElementById('taskPriority');
const taskDueDateInput = document.getElementById('taskDueDate');
const taskCategoryInput = document.getElementById('taskCategory');

const storageKey = 'task-engineering-app.tasks';
let tasks = loadTasks();
let editingTaskId = null;
let deletingTaskId = null;

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

function getTaskById(taskId) {
	return tasks.find((task) => task.id === taskId);
}

function openModal(modalElement) {
	modalElement.classList.add('is-open');
	modalElement.setAttribute('aria-hidden', 'false');
	document.body.classList.add('modal-open');
}

function closeModal(modalElement) {
	modalElement.classList.remove('is-open');
	modalElement.setAttribute('aria-hidden', 'true');

	if (!taskModal.classList.contains('is-open') && !deleteModal.classList.contains('is-open')) {
		document.body.classList.remove('modal-open');
	}
}

function resetTaskForm() {
	taskForm.reset();
	taskPriorityInput.value = 'media';
	editingTaskId = null;
	taskModalTitle.textContent = 'Nueva tarea';
	saveTaskButton.textContent = 'Agregar tarea';
}

function fillTaskForm(task) {
	taskTitleInput.value = task.title || '';
	taskDescriptionInput.value = task.description || '';
	taskPriorityInput.value = task.priority || 'media';
	taskDueDateInput.value = task.dueDate || '';
	taskCategoryInput.value = task.category || '';
}

function openTaskModal(task = null) {
	setMessage('');

	if (task) {
		editingTaskId = task.id;
		taskModalTitle.textContent = 'Editar tarea';
		saveTaskButton.textContent = 'Guardar cambios';
		taskForm.reset();
		fillTaskForm(task);
	} else {
		resetTaskForm();
	}

	openModal(taskModal);
	globalThis.setTimeout(() => taskTitleInput.focus(), 0);
}

function closeTaskModal() {
	closeModal(taskModal);
	resetTaskForm();
}

function openDeleteModal(taskId) {
	const task = getTaskById(taskId);

	if (!task) {
		return;
	}

	deletingTaskId = taskId;
	deleteTaskName.textContent = task.title;
	openModal(deleteModal);
}

function closeDeleteModal() {
	deletingTaskId = null;
	closeModal(deleteModal);
}

function normalizeText(value) {
	return value.toLowerCase().trim();
}

function getFilteredTasks() {
	const query = normalizeText(taskSearch.value);
	const status = taskStatusFilter.value;

	return tasks.filter((task) => {
		const matchesQuery = !query || [task.title, task.description, task.category]
			.filter(Boolean)
			.some((field) => normalizeText(field).includes(query));
		const isCompleted = Boolean(task.completed);
		const matchesStatus = status === 'all'
			|| (status === 'pending' && !isCompleted)
			|| (status === 'completed' && isCompleted);

		return matchesQuery && matchesStatus;
	});
}

function updateStats() {
	const completed = tasks.filter((task) => task.completed).length;

	totalTasks.textContent = tasks.length;
	pendingTasks.textContent = tasks.length - completed;
	doneTasks.textContent = completed;
}

function renderEmptyState(message = 'No hay tareas todavía. Usa el panel para crear la primera.') {
	taskList.innerHTML = '';
	taskList.classList.add('is-empty');
	taskList.textContent = message;
}

function renderTasks() {
	if (!tasks.length) {
		renderEmptyState();
		updateStats();
		return;
	}

	const filteredTasks = getFilteredTasks();

	taskList.classList.remove('is-empty');
	taskList.innerHTML = '';

	if (!filteredTasks.length) {
		renderEmptyState('No hay tareas que coincidan con los filtros actuales.');
		updateStats();
		return;
	}

	filteredTasks.forEach((task) => {
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
		toggleButton.querySelector('.task-toggle__label').textContent = task.completed ? 'Reabrir' : 'Completar';

		card.querySelector('.task-edit').addEventListener('click', () => openTaskModal(task));

		toggleButton.addEventListener('click', () => toggleTask(task.id));
		card.querySelector('.task-delete').addEventListener('click', () => openDeleteModal(task.id));

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

function updateTask(taskId, taskData) {
	tasks = tasks.map((task) => (
		task.id === taskId
			? { ...task, ...taskData }
			: task
	));

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

function clearFilters() {
	taskSearch.value = '';
	taskStatusFilter.value = 'all';
	renderTasks();
}

taskForm.addEventListener('submit', (event) => {
	event.preventDefault();

	const title = taskTitleInput.value.trim();
	const description = taskDescriptionInput.value.trim();
	const priority = taskPriorityInput.value;
	const dueDate = taskDueDateInput.value;
	const category = taskCategoryInput.value.trim();

	if (!title || !dueDate) {
		setMessage('Completa al menos el título y la fecha límite.', 'is-error');
		return;
	}

	const taskData = {
		title,
		description,
		priority,
		dueDate,
		category,
	};

	if (editingTaskId) {
		updateTask(editingTaskId, taskData);
		setMessage('Tarea actualizada correctamente.', 'is-success');
	} else {
		addTask(taskData);
		setMessage('Tarea agregada correctamente.', 'is-success');
	}

	closeTaskModal();
});

openTaskModalButton.addEventListener('click', () => openTaskModal());
clearFiltersButton.addEventListener('click', clearFilters);
taskSearch.addEventListener('input', renderTasks);
taskStatusFilter.addEventListener('change', renderTasks);

document.querySelectorAll('[data-modal-close]').forEach((element) => {
	element.addEventListener('click', () => {
		const modalType = element.dataset.modalClose;

		if (modalType === 'task') {
			closeTaskModal();
		}

		if (modalType === 'delete') {
			closeDeleteModal();
		}
	});
});

confirmDeleteButton.addEventListener('click', () => {
	if (!deletingTaskId) {
		return;
	}

	deleteTask(deletingTaskId);
	closeDeleteModal();
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
		closeTaskModal();
		closeDeleteModal();
	}
});

renderTasks();
