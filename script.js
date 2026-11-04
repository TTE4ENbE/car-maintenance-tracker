
// КЛАСС ЛОГИКИ (TOService)
class TOService {
    constructor() {
        this.records = [];
        this.currentMileage = 0;
        this.load();
    }

    // Расчёт статуса ТО
    calculateStatus(mileage, interval) {
        if (this.currentMileage - mileage >= interval) {
            return "Пора!";
        }
        return "Ок";
    }

    // Добавление записи
    addRecord(name, interval, mileage, date) {
        const record = {
            id: Date.now(),
            name: name,
            interval: parseInt(interval),
            mileage: parseInt(mileage),
            date: date,
            status: this.calculateStatus(parseInt(mileage), parseInt(interval))
        };
        this.records.push(record);
        this.save();
        return record;
    }

    // Редактирование записи
    updateRecord(id, name, interval, mileage, date) {
        const record = this.records.find(r => r.id === id);
        if (record) {
            record.name = name;
            record.interval = parseInt(interval);
            record.mileage = parseInt(mileage);
            record.date = date;
            record.status = this.calculateStatus(parseInt(mileage), parseInt(interval));
            this.save();
        }
        return record;
    }

    // Удаление записи
    deleteRecord(id) {
        this.records = this.records.filter(r => r.id !== id);
        this.save();
    }

    // Сохранение в localStorage
    save() {
        localStorage.setItem('to_records', JSON.stringify(this.records));
        localStorage.setItem('current_mileage', String(this.currentMileage));
    }

    // Загрузка из localStorage
    load() {
        const data = localStorage.getItem('to_records');
        if (data) {
            try {
                this.records = JSON.parse(data);
            } catch (e) {
                this.records = [];
            }
        }
        const mileage = localStorage.getItem('current_mileage');
        if (mileage) {
            this.currentMileage = parseInt(mileage);
        }
        // Пересчёт статусов при загрузке
        this.records.forEach(r => {
            r.status = this.calculateStatus(r.mileage, r.interval);
        });
    }

    // Установка текущего пробега
    setCurrentMileage(mileage) {
        this.currentMileage = parseInt(mileage);
        this.records.forEach(r => {
            r.status = this.calculateStatus(r.mileage, r.interval);
        });
        this.save();
    }

    // Получение всех записей
    getRecords() {
        return this.records;
    }
}

// Инициализация сервиса
const service = new TOService();


// ФУНКЦИИ ИНТЕРФЕЙСА (UI)

// Привычное отображения даты (ДД.ММ.ГГГГ)
function formatDate(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateString;
}

// Отрисовка списка записей
function renderRecords() {
    const list = document.getElementById('recordsList');
    const records = service.getRecords();

    if (records.length === 0) {
        list.innerHTML = '<div class="empty-state">Нет записей. Добавьте первую запись!</div>';
        return;
    }

    list.innerHTML = '';
    records.forEach(r => {
        const div = document.createElement('div');
        div.className = `record ${r.status === 'Пора!' ? 'danger' : 'ok'}`;
        div.innerHTML = `
            <span>${r.name}</span>
            <span>${r.interval} км</span>
            <span>${r.mileage} км</span>
            <span>${formatDate(r.date)}</span>
            <span class="status">${r.status}</span>
            <button onclick="openEditModal(${r.id})">✎</button>
            <button onclick="deleteRecord(${r.id})">✕</button>
        `;
        list.appendChild(div);
    });
}

// Обновление пробега
function updateMileage() {
    const input = document.getElementById('mileageInput');
    const val = parseInt(input.value);
    if (!isNaN(val) && val >= 0) {
        service.setCurrentMileage(val);
        renderRecords();
        updateMileageDisplay();
        input.value = '';
    } else {
        alert('Введите корректное значение пробега (число)');
    }
}

// Функция для обновления визуального отображения пробега
function updateMileageDisplay() {
    const display = document.getElementById('currentMileageDisplay');
    if (display) {
        display.innerHTML = `Сохранённый пробег: <strong>${service.currentMileage}</strong> км`;
    }
}

// Открытие окна добавления
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Добавить запись ТО';
    document.getElementById('recordName').value = '';
    document.getElementById('recordInterval').value = '';
    document.getElementById('recordMileage').value = '';
    document.getElementById('recordDate').value = '';
    document.getElementById('recordId').value = '';
    document.getElementById('modal').classList.add('active');
}

// Открытие окна редактирования
function openEditModal(id) {
    const record = service.getRecords().find(r => r.id === id);
    if (!record) return;

    document.getElementById('modalTitle').textContent = 'Редактировать запись';
    document.getElementById('recordName').value = record.name;
    document.getElementById('recordInterval').value = record.interval;
    document.getElementById('recordMileage').value = record.mileage;
    document.getElementById('recordDate').value = record.date;
    document.getElementById('recordId').value = record.id;
    document.getElementById('modal').classList.add('active');
}

// Закрытие окна
function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// Сохранение записи (добавление или редактирование)
function saveRecord() {
    const name = document.getElementById('recordName').value.trim();
    const interval = document.getElementById('recordInterval').value;
    const mileage = document.getElementById('recordMileage').value;
    const date = document.getElementById('recordDate').value;
    const id = document.getElementById('recordId').value;

    // Валидация
    if (!name) { alert('Введите название работы'); return; }
    if (!interval || parseInt(interval) <= 0) { alert('Введите корректную периодичность'); return; }
    if (!mileage || parseInt(mileage) < 0) { alert('Введите корректный пробег'); return; }
    if (!date) { alert('Выберите дату'); return; }

    if (id) {
        service.updateRecord(parseInt(id), name, interval, mileage, date);
    } else {
        service.addRecord(name, interval, mileage, date);
    }

    closeModal();
    renderRecords();
}

// Удаление записи
function deleteRecord(id) {
    if (confirm('Удалить эту запись?')) {
        service.deleteRecord(id);
        renderRecords();
    }
}

// Инициализация при загрузке страницы
window.onload = function() {
    const saved = localStorage.getItem('current_mileage');
    if (saved) {
        document.getElementById('mileageInput').value = saved;
    }
    renderRecords();
    updateMileageDisplay();
};

// Обработчик нажатия Enter в поле пробега
document.getElementById('mileageInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        updateMileage();
    }
});