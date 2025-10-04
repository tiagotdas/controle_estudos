document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA DO CRONÔMETRO ---
    const display = document.getElementById('stopwatch-display');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');

    let timerInterval = null;
    let elapsedTime = 0;
    let startTime = 0;
    let isPaused = false;
    let studySessionStartTime = null;

    const formatTime = (time) => {
        const pad = (num) => String(num).padStart(2, '0');
        const seconds = Math.floor((time / 1000) % 60);
        const minutes = Math.floor((time / (1000 * 60)) % 60);
        const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    const formatTimeForInput = (date) => {
        const pad = (num) => String(num).padStart(2, '0');
        return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const updateDisplay = () => {
        const currentTime = Date.now();
        const currentElapsedTime = elapsedTime + (currentTime - startTime);
        display.textContent = formatTime(currentElapsedTime);
    };

    startBtn.addEventListener('click', () => {
        if (studySessionStartTime === null) {
            studySessionStartTime = new Date();
        }
        startTime = Date.now();
        isPaused = false;
        timerInterval = setInterval(updateDisplay, 100);
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
    });

    pauseBtn.addEventListener('click', () => {
        if (!isPaused) {
            clearInterval(timerInterval);
            elapsedTime += Date.now() - startTime;
            isPaused = true;
            pauseBtn.textContent = 'Retomar';
        } else {
            startTime = Date.now();
            timerInterval = setInterval(updateDisplay, 100);
            isPaused = false;
            pauseBtn.textContent = 'Pausar';
        }
    });

    stopBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        const studySessionEndTime = new Date();
        startTimeInput.value = formatTimeForInput(studySessionStartTime);
        endTimeInput.value = formatTimeForInput(studySessionEndTime);
        display.textContent = '00:00:00';
        elapsedTime = 0;
        studySessionStartTime = null;
        isPaused = false;
        pauseBtn.textContent = 'Pausar';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
    });

    // --- ELEMENTOS DO DOM E VARIÁVEIS GLOBAIS ---
    const form = document.getElementById('study-form');
    const tableBody = document.getElementById('logs-table-body');
    const noDataMessage = document.getElementById('no-data-message');
    const dateInput = document.getElementById('date');

    const toastContainer = document.getElementById('toast-container');
    const searchInput = document.getElementById('search-input');
    const filterStartDate = document.getElementById('filter-start-date');
    const filterEndDate = document.getElementById('filter-end-date');
    const clearFilterBtn = document.getElementById('clear-filter-btn');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const subjectColorInput = document.getElementById('subject-color');
    const subjectInput = document.getElementById('subject');
    const remindersSection = document.getElementById('reminders-section');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');

    const editModal = document.getElementById('edit-modal');

    const chartCanvas = document.getElementById('study-chart');
    const pieChartBtn = document.getElementById('pie-chart-btn');
    const barChartBtn = document.getElementById('bar-chart-btn');
    let studyChart = null;
    let currentChartType = 'pie';

    let studyLogs = JSON.parse(localStorage.getItem('studyLogs')) || [];
    let subjectColors = JSON.parse(localStorage.getItem('subjectColors')) || {};

    // --- FUNÇÕES UTILITÁRIAS ---
    const saveLogs = () => localStorage.setItem('studyLogs', JSON.stringify(studyLogs));
    const saveColors = () => localStorage.setItem('subjectColors', JSON.stringify(subjectColors));

    const calculateDuration = (start, end) => {
        if (!start || !end) return 'N/A';
        const startDate = new Date(`1970-01-01T${start}:00`);
        const endDate = new Date(`1970-01-01T${end}:00`);
        let diff = endDate.getTime() - startDate.getTime();
        if (diff < 0) diff += 24 * 60 * 60 * 1000;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    // --- LÓGICA DE NOTIFICAÇÕES (TOAST) ---
    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        toast.className = `toast-enter ${bgColor} text-white font-bold py-2 px-4 rounded-lg shadow-lg`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.remove('toast-enter');
            toast.classList.add('toast-leave');
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    };

    // --- LÓGICA DE RENDERIZAÇÃO ---
    const renderLogs = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const startDate = filterStartDate.value ? new Date(filterStartDate.value + 'T00:00:00') : null;
        const endDate = filterEndDate.value ? new Date(filterEndDate.value + 'T23:59:59') : null;

        const filteredLogs = studyLogs.filter(log => {
            const logDate = new Date(log.date + 'T00:00:00');
            const matchesSearch = log.subject.toLowerCase().includes(searchTerm);
            const matchesStartDate = !startDate || logDate >= startDate;
            const matchesEndDate = !endDate || logDate <= endDate;
            return matchesSearch && matchesStartDate && matchesEndDate;
        });

        tableBody.innerHTML = '';
        if (filteredLogs.length === 0) {
            noDataMessage.style.display = 'block';
            tableBody.style.display = 'none';
        } else {
            noDataMessage.style.display = 'none';
            tableBody.style.display = '';

            const sortedLogs = filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

            sortedLogs.forEach(log => {
                const color = subjectColors[log.subject] || '#cccccc';
                const row = document.createElement('tr');
                row.className = 'fade-in hover:bg-gray-100';
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="w-3 h-3 rounded-full mr-3" style="background-color: ${color};"></div>
                            <div>
                                <div class="text-sm font-medium text-gray-900">${log.subject} ${log.lessonNumber ? `(Aula ${log.lessonNumber})` : ''}</div>
                                <div class="text-xs text-gray-500">${log.comments || 'Sem comentários'}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(log.date)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${log.duration}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button data-id="${log.id}" class="edit-btn text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                        <button data-id="${log.id}" class="delete-btn text-red-600 hover:text-red-900">Apagar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
        checkReminders();
        renderChart(filteredLogs);
    };

    const renderChart = (logs) => {
        if (studyChart) studyChart.destroy();
        if (!logs || logs.length === 0) {
            chartCanvas.getContext('2d').clearRect(0, 0, chartCanvas.width, chartCanvas.height);
            return;
        }

        const subjectData = logs.reduce((acc, log) => {
            const durationParts = log.duration.match(/(\d+)h (\d+)m/);
            if (!durationParts) return acc;
            const totalMinutes = parseInt(durationParts[1], 10) * 60 + parseInt(durationParts[2], 10);
            acc[log.subject] = (acc[log.subject] || 0) + totalMinutes;
            return acc;
        }, {});

        const labels = Object.keys(subjectData);
        const data = Object.values(subjectData);
        const backgroundColors = labels.map(label => subjectColors[label] || '#cccccc');

        studyChart = new Chart(chartCanvas, {
            type: currentChartType,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Minutos Estudados',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(c => c.replace(/, ?0.8\)/, ', 1)')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: currentChartType === 'pie',
                        labels: { color: '#333' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) label += ': ';
                                const value = (currentChartType === 'bar') ? context.parsed.y : context.parsed;
                                const hours = Math.floor(value / 60);
                                const minutes = value % 60;
                                label += `${hours}h ${minutes}m`;
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#333' }
                    },
                    x: {
                        ticks: { color: '#333' }
                    }
                }
            }
        });
    };

    const checkReminders = () => {
        remindersSection.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pendingReminders = studyLogs.filter(log => {
            if (!log.reminderDate) return false;
            const reminderDate = new Date(log.reminderDate + 'T00:00:00');
            return reminderDate <= today;
        });

        if (pendingReminders.length > 0) {
            const reminderContainer = document.createElement('div');
            reminderContainer.className = 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg shadow-md fade-in';

            let reminderList = '<h3 class="font-bold text-lg mb-2">Lembretes de Revisão!</h3><ul class="list-disc list-inside">';
            pendingReminders.forEach(log => {
                reminderList += `<li>Revisar: <strong>${log.subject}</strong> (estudado em ${formatDate(log.date)})</li>`;
            });
            reminderList += '</ul>';

            reminderContainer.innerHTML = reminderList;
            remindersSection.appendChild(reminderContainer);
        }
    };

    // --- LÓGICA DOS EVENTOS ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!form['start-time'].value || !form['end-time'].value) {
            showToast('Use o cronômetro para registrar o tempo.', 'error');
            return;
        }

        const subject = subjectInput.value;
        const newLog = {
            id: Date.now(),
            subject: subject,
            lessonNumber: form['lesson-number'].value,
            date: form.date.value,
            startTime: form['start-time'].value,
            endTime: form['end-time'].value,
            duration: calculateDuration(form['start-time'].value, form['end-time'].value),
            comments: form.comments.value,
            reminderDate: form['reminder-date'].value,
        };

        studyLogs.push(newLog);
        subjectColors[subject] = subjectColorInput.value;

        saveLogs();
        saveColors();
        renderLogs();
        form.reset();
        dateInput.valueAsDate = new Date();
        subjectInput.focus();
        showToast('Registro salvo com sucesso!');
    });

    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.classList.contains('delete-btn')) {
            const id = parseInt(target.dataset.id, 10);
            if (confirm('Tem certeza que deseja apagar este registro?')) {
                studyLogs = studyLogs.filter(log => log.id !== id);
                saveLogs();
                renderLogs();
                showToast('Registro apagado.', 'error');
            }
        }

        if (target.classList.contains('edit-btn')) {
            const id = parseInt(target.dataset.id, 10);
            const logToEdit = studyLogs.find(log => log.id === id);
            if (logToEdit) {
                openEditModal(logToEdit);
            }
        }
    });

    const openEditModal = (log) => {
        editModal.innerHTML = `
            <div class="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
                <h3 class="text-2xl font-semibold text-center mb-6">Editar Registro</h3>
                <form id="edit-form" class="space-y-4">
                    <input type="hidden" id="edit-id" value="${log.id}">
                    <div class="flex items-end gap-4">
                        <div class="flex-grow">
                            <label for="edit-subject" class="block text-sm font-medium text-gray-700">Assunto</label>
                            <input type="text" id="edit-subject" value="${log.subject}" required class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
                        </div>
                        <input type="color" id="edit-subject-color" value="${subjectColors[log.subject] || '#54a0ff'}">
                    </div>
                    <div class="grid grid-cols-3 gap-4">
                       <div class="col-span-2">
                            <label for="edit-date" class="block text-sm font-medium text-gray-700">Data</label>
                            <input type="date" id="edit-date" value="${log.date}" required class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
                        </div>
                        <div>
                            <label for="edit-lesson-number" class="block text-sm font-medium text-gray-700">Nº Aula</label>
                            <input type="number" id="edit-lesson-number" value="${log.lessonNumber || ''}" min="1" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="edit-start-time" class="block text-sm font-medium text-gray-700">Início</label>
                            <input type="time" id="edit-start-time" value="${log.startTime}" required class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
                        </div>
                        <div>
                            <label for="edit-end-time" class="block text-sm font-medium text-gray-700">Fim</label>
                            <input type="time" id="edit-end-time" value="${log.endTime}" required class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
                        </div>
                    </div>
                    <div>
                        <label for="edit-comments" class="block text-sm font-medium text-gray-700">Comentários</label>
                        <textarea id="edit-comments" rows="3" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">${log.comments || ''}</textarea>
                    </div>
                    <div>
                        <label for="edit-reminder-date" class="block text-sm font-medium text-gray-700">Lembrete de Revisão</label>
                        <input type="date" id="edit-reminder-date" value="${log.reminderDate || ''}" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
                    </div>
                    <div class="flex justify-end space-x-3 pt-4">
                        <button type="button" id="cancel-edit-btn" class="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" class="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        `;
        editModal.classList.remove('hidden');

        document.getElementById('cancel-edit-btn').addEventListener('click', () => editModal.classList.add('hidden'));

        document.getElementById('edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = parseInt(document.getElementById('edit-id').value, 10);
            const logIndex = studyLogs.findIndex(log => log.id === id);

            if (logIndex > -1) {
                const startTime = document.getElementById('edit-start-time').value;
                const endTime = document.getElementById('edit-end-time').value;
                const subject = document.getElementById('edit-subject').value;

                studyLogs[logIndex] = {
                    ...studyLogs[logIndex],
                    subject: subject,
                    lessonNumber: document.getElementById('edit-lesson-number').value,
                    date: document.getElementById('edit-date').value,
                    startTime: startTime,
                    endTime: endTime,
                    duration: calculateDuration(startTime, endTime),
                    comments: document.getElementById('edit-comments').value,
                    reminderDate: document.getElementById('edit-reminder-date').value,
                };

                subjectColors[subject] = document.getElementById('edit-subject-color').value;

                saveLogs();
                saveColors();
                renderLogs();
                editModal.classList.add('hidden');
                showToast('Registro atualizado com sucesso!');
            }
        });
    };

    // Eventos de Filtro e Pesquisa
    [searchInput, filterStartDate, filterEndDate].forEach(el => el.addEventListener('input', renderLogs));
    clearFilterBtn.addEventListener('click', () => {
        filterStartDate.value = '';
        filterEndDate.value = '';
        searchInput.value = '';
        renderLogs();
    });

    // Eventos do Formulário
    clearFormBtn.addEventListener('click', () => {
        form.reset();
        dateInput.valueAsDate = new Date();
        subjectInput.focus();
    });

    subjectInput.addEventListener('input', () => {
        const color = subjectColors[subjectInput.value];
        if (color) subjectColorInput.value = color;
    });

    document.querySelectorAll('.reminder-shortcut-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const days = parseInt(e.target.dataset.days, 10);
            const studyDate = new Date(dateInput.value + 'T00:00:00');
            studyDate.setDate(studyDate.getDate() + days);
            document.getElementById('reminder-date').value = studyDate.toISOString().split('T')[0];
        });
    });

    // Eventos do Gráfico
    pieChartBtn.addEventListener('click', () => {
        currentChartType = 'pie';
        renderLogs();
        pieChartBtn.classList.add('bg-indigo-600', 'text-white');
        pieChartBtn.classList.remove('text-gray-700', 'dark:text-gray-300');
        barChartBtn.classList.remove('bg-indigo-600', 'text-white');
        barChartBtn.classList.add('text-gray-700', 'dark:text-gray-300');
    });

    barChartBtn.addEventListener('click', () => {
        currentChartType = 'bar';
        renderLogs();
        barChartBtn.classList.add('bg-indigo-600', 'text-white');
        barChartBtn.classList.remove('text-gray-700');
        pieChartBtn.classList.remove('bg-indigo-600', 'text-white');
        pieChartBtn.classList.add('text-gray-700');
    });

    // Eventos de Ações Gerais
    exportCsvBtn.addEventListener('click', () => {
        if (studyLogs.length === 0) {
            showToast('Não há dados para exportar.', 'error');
            return;
        }
        const headers = ['ID', 'Assunto', 'Nº Aula', 'Data', 'Início', 'Fim', 'Duração', 'Comentários', 'Lembrete'];
        const rows = studyLogs.map(log => [
            log.id,
            `"${log.subject.replace(/"/g, '""')}"`,
            log.lessonNumber || '',
            formatDate(log.date),
            log.startTime,
            log.endTime,
            log.duration,
            `"${(log.comments || '').replace(/"/g, '""')}"`,
            log.reminderDate ? formatDate(log.reminderDate) : ''
        ].join(','));

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'registros_de_estudo.csv';
        link.click();
        showToast('Exportação para CSV iniciada.');
    });

    clearAllBtn.addEventListener('click', () => {
        if (studyLogs.length === 0) {
            showToast('Não há registros para limpar.', 'error');
            return;
        }
        if (confirm('ATENÇÃO! Você tem certeza que deseja apagar TODOS os registros? Esta ação não pode ser desfeita.')) {
            studyLogs = [];
            subjectColors = {};
            saveLogs();
            saveColors();
            renderLogs();
            showToast('Todos os registros foram apagados.', 'error');
        }
    });

    // --- INICIALIZAÇÃO ---
    dateInput.valueAsDate = new Date();
    renderLogs();
});