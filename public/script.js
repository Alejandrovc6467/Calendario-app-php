let currentYear = new Date().getFullYear();
let markedDays = {};
let currentEditingDate = null;
let currentMobileMonth = 0; // Para navegación móvil

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const dayNames = ["D", "L", "M", "X", "J", "V", "S"];

async function init() {
  await loadData();
  currentMobileMonth = new Date().getMonth(); // Iniciar en el mes actual
  renderCalendar();

  document.getElementById("modal").addEventListener("click", function (e) {
    if (e.target === this) closeModal();
  });

  document
    .getElementById("cantidadVeces")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") saveEntry();
    });

  // Detectar cambios de tamaño de ventana
  window.addEventListener('resize', function() {
    updateMobileView();
  });

  updateMobileView();
}

function updateMobileView() {
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    showMobileMonth(currentMobileMonth);
  } else {
    // En desktop, mostrar todos los meses
    const months = document.querySelectorAll('.month');
    months.forEach(month => {
      month.classList.remove('active-mobile');
    });
  }
}

function changeMobileMonth(delta) {
  currentMobileMonth += delta;
  
  // Ajustar límites
  if (currentMobileMonth < 0) {
    currentMobileMonth = 11;
    changeYear(-1);
    return;
  }
  if (currentMobileMonth > 11) {
    currentMobileMonth = 0;
    changeYear(1);
    return;
  }
  
  showMobileMonth(currentMobileMonth);
}

function showMobileMonth(monthIndex) {
  const months = document.querySelectorAll('.month');
  months.forEach((month, index) => {
    if (index === monthIndex) {
      month.classList.add('active-mobile');
    } else {
      month.classList.remove('active-mobile');
    }
  });
  
  // Actualizar el texto del mes actual
  document.getElementById('currentMobileMonth').textContent = monthNames[monthIndex];
}

function showStatus(message, isError = false) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = "status " + (isError ? "error" : "connected");
  setTimeout(() => {
    status.style.display = "none";
  }, 3000);
  status.style.display = "block";
}

async function loadData() {
  try {
    // Ruta absoluta desde la raíz del proyecto
    const response = await fetch("../api/datos.php");
    if (!response.ok) throw new Error("Error al cargar datos");
    markedDays = await response.json();
    showStatus("✓ Datos cargados correctamente");
    document.getElementById("loadingMsg").style.display = "none";
    document.getElementById("calendar").style.display = "grid";
  } catch (error) {
    console.error("Error:", error);
    showStatus("✗ Error al conectar con el servidor", true);
    document.getElementById("loadingMsg").textContent =
      "⚠️ No se pudo conectar con el servidor. Asegúrate de que está corriendo.";
  }
}

async function saveData() {
  try {
    // Ruta absoluta desde la raíz del proyecto
    const response = await fetch("../api/datos.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(markedDays),
    });

    if (!response.ok) throw new Error("Error al guardar");
    const result = await response.json();
    showStatus("✓ Guardado automáticamente");
  } catch (error) {
    console.error("Error al guardar:", error);
    showStatus("✗ Error al guardar los datos", true);
  }
}

function getColorForCount(count) {
  if (count === 0) return "#1a1a1a";
  if (count === 1) return "#ffa500";
  if (count === 2) return "#ff4444";
  return "#cc0000";
}

function calculateMonthTotal(month) {
  let total = 0;
  for (let day = 1; day <= 31; day++) {
    const dateKey = `${currentYear}-${month}-${day}`;
    if (markedDays[dateKey]) {
      total += markedDays[dateKey];
    }
  }
  return total;
}

function calculateMonthActiveDays(month) {
  let activeDays = 0;
  for (let day = 1; day <= 31; day++) {
    const dateKey = `${currentYear}-${month}-${day}`;
    if (markedDays[dateKey] && markedDays[dateKey] > 0) {
      activeDays++;
    }
  }
  return activeDays;
}

function calculateStatistics() {
  let yearTotal = 0;
  let monthTotals = new Array(12).fill(0);
  let activeDays = 0;

  for (let month = 0; month < 12; month++) {
    for (let day = 1; day <= 31; day++) {
      const dateKey = `${currentYear}-${month}-${day}`;
      if (markedDays[dateKey]) {
        const count = markedDays[dateKey];
        monthTotals[month] += count;
        yearTotal += count;
        activeDays++;
      }
    }
  }

  let maxMonth = 0;
  let maxCount = monthTotals[0];
  for (let i = 1; i < 12; i++) {
    if (monthTotals[i] > maxCount) {
      maxCount = monthTotals[i];
      maxMonth = i;
    }
  }

  const average = yearTotal > 0 ? Math.round((yearTotal / 12) * 10) / 10 : 0;
  const daysWithoutActivity = calculateDaysWithoutActivity();

  document.getElementById("statTotal").textContent = yearTotal;
  document.getElementById("statTopMonth").textContent =
    maxCount > 0 ? monthNames[maxMonth] : "-";
  document.getElementById("statTopMonthCount").textContent =
    maxCount > 0 ? `${maxCount} veces` : "0 veces";
  document.getElementById("statAverage").textContent = average;
  document.getElementById("statActiveDays").textContent = activeDays;
  document.getElementById("statStreak").textContent = daysWithoutActivity;
}

function calculateDaysWithoutActivity() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let lastActivityDate = null;

  for (const dateKey in markedDays) {
    if (markedDays[dateKey] > 0) {
      const [year, month, day] = dateKey.split("-").map(Number);
      const activityDate = new Date(year, month, day);
      activityDate.setHours(0, 0, 0, 0);

      if (activityDate <= today) {
        if (!lastActivityDate || activityDate > lastActivityDate) {
          lastActivityDate = activityDate;
        }
      }
    }
  }

  if (!lastActivityDate) {
    return 0;
  }

  const diffTime = today.getTime() - lastActivityDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

function changeYear(delta) {
  currentYear += delta;
  renderCalendar();
}

function renderCalendar() {
  document.getElementById("currentYear").textContent = currentYear;
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  for (let month = 0; month < 12; month++) {
    const monthDiv = document.createElement("div");
    monthDiv.className = "month";

    const monthHeader = document.createElement("div");
    monthHeader.className = "month-header";

    const monthNameDiv = document.createElement("div");
    monthNameDiv.className = "month-name";
    monthNameDiv.textContent = monthNames[month];

    const monthStatsDiv = document.createElement("div");
    monthStatsDiv.className = "month-stats";

    const monthCount = document.createElement("div");
    monthCount.className = "month-count";
    const total = calculateMonthTotal(month);
    monthCount.textContent = total;
    monthCount.title = `Total: ${total} veces`;

    const monthActiveDays = document.createElement("div");
    monthActiveDays.className = "month-active-days";
    const activeDays = calculateMonthActiveDays(month);
    monthActiveDays.textContent = activeDays;
    monthActiveDays.title = `Días activos: ${activeDays}`;

    monthStatsDiv.appendChild(monthCount);
    monthStatsDiv.appendChild(monthActiveDays);

    monthHeader.appendChild(monthNameDiv);
    monthHeader.appendChild(monthStatsDiv);
    monthDiv.appendChild(monthHeader);

    const daysHeader = document.createElement("div");
    daysHeader.className = "days-header";
    dayNames.forEach((day) => {
      const dayHeader = document.createElement("div");
      dayHeader.className = "day-header";
      dayHeader.textContent = day;
      daysHeader.appendChild(dayHeader);
    });
    monthDiv.appendChild(daysHeader);

    const daysDiv = document.createElement("div");
    daysDiv.className = "days";

    const firstDay = new Date(currentYear, month, 1).getDay();
    const daysInMonth = new Date(currentYear, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement("div");
      emptyDay.className = "day empty";
      daysDiv.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDiv = document.createElement("div");
      dayDiv.className = "day";
      dayDiv.textContent = day;

      const dateKey = `${currentYear}-${month}-${day}`;
      const count = markedDays[dateKey] || 0;

      if (count > 0) {
        dayDiv.classList.add("marked");
        dayDiv.setAttribute("data-count", count);
        dayDiv.style.background = getColorForCount(count);
        dayDiv.style.borderColor = getColorForCount(count);
        dayDiv.style.color = "white";
      }

      dayDiv.onclick = () => openModal(dateKey, count);
      daysDiv.appendChild(dayDiv);
    }

    monthDiv.appendChild(daysDiv);
    calendar.appendChild(monthDiv);
  }

  calculateStatistics();
  updateMobileView();
}

function openModal(dateKey, currentCount) {
  currentEditingDate = dateKey;
  const [year, month, day] = dateKey.split("-");
  document.getElementById("modalHeader").textContent = `${day} de ${
    monthNames[parseInt(month)]
  } ${year}`;
  document.getElementById("cantidadVeces").value = currentCount;
  document.getElementById("modal").classList.add("active");
  document.getElementById("cantidadVeces").focus();
  document.getElementById("cantidadVeces").select();
}

function closeModal() {
  document.getElementById("modal").classList.remove("active");
  currentEditingDate = null;
}

async function saveEntry() {
  const count = parseInt(document.getElementById("cantidadVeces").value) || 0;

  if (count === 0) {
    delete markedDays[currentEditingDate];
  } else {
    markedDays[currentEditingDate] = count;
  }

  await saveData();
  renderCalendar();
  closeModal();
}

async function deleteEntry() {
  delete markedDays[currentEditingDate];
  await saveData();
  renderCalendar();
  closeModal();
}

init();