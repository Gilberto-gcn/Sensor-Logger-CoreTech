// ========== IMPORTS ========== WARN: Lúcio Adicionei import
import RaylibModuleFactory from "./quick_example.js";
// import { initGame } from "./teste";

// ========== CONFIGURAÇÃO ==========
// const ESP32_IP = "10.229.209.118:80"; // <<< CONFIGURE SEU IP AQUI
const ESP32_IP = "10.229.209.118:80"; // <<< CONFIGURE SEU IP AQUI
const MAX_DATA_POINTS = 50;
const MAX_HISTORY_RECORDS = 100; // Máximo de registros históricos para CSV
const R_REF = 10000; // 10kΩ
const B_COEFFICIENT = 3950; // Beta do NTC
const T0 = 298.15; // 25°C em Kelvin
const VCC = 3.3;
// ========

// ========== ESTADO GLOBAL ==========
let ws = null;
let timeCounter = 0;
let reconnectInterval = null;

// Histórico de dados para exportação CSV
let dataHistory = [];

// ========== CRIAÇÃO DOS GRÁFICOS ==========
const chartConfig = {
  type: "line",
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#e8f1f5",
          font: { family: "Rajdhani", size: 12 },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0, 240, 255, 0.1)" },
        ticks: { color: "#7a8ba0", font: { family: "Rajdhani" } },
      },
      y: {
        grid: { color: "rgba(0, 240, 255, 0.1)" },
        ticks: { color: "#7a8ba0", font: { family: "Rajdhani" } },
      },
    },
  },
};

// Gráfico: Temperatura do Termistor × Tempo
const termistorTempChart = new Chart(
  document.getElementById("termistorTempChart").getContext("2d"),
  {
    ...chartConfig,
    data: {
      labels: [],
      datasets: [
        {
          label: "Temperatura (°C)",
          data: [],
          borderColor: "#06ffa5",
          backgroundColor: "rgba(6, 255, 165, 0.1)",
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        },
      ],
    },
  },
);

// Gráfico: Termistor ADC × Tempo
const termistorChart = new Chart(
  document.getElementById("termistorChart").getContext("2d"),
  {
    ...chartConfig,
    data: {
      labels: [],
      datasets: [
        {
          label: "ADC Raw",
          data: [],
          borderColor: "#ff006e",
          backgroundColor: "rgba(255, 0, 110, 0.1)",
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        },
      ],
    },
  },
);

// Gráfico: Resistência × Tempo
const resistanceChart = new Chart(
  document.getElementById("resistanceChart").getContext("2d"),
  {
    ...chartConfig,
    data: {
      labels: [],
      datasets: [
        {
          label: "Resistência (Ω)",
          data: [],
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        },
      ],
    },
  },
);

// Gráfico: Curva de Temperatura (scatter plot)
const temperatureCurveChart = new Chart(
  document.getElementById("temperatureCurveChart").getContext("2d"),
  {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Curva Teórica",
          data: [],
          borderColor: "#00f0ff",
          backgroundColor: "rgba(0, 240, 255, 0.2)",
          showLine: true,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: "Ponto Atual",
          data: [],
          backgroundColor: "#ffbe0b",
          borderColor: "#ff006e",
          pointRadius: 8,
          pointHoverRadius: 12,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "#e8f1f5",
            font: { family: "Rajdhani", size: 12 },
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Resistência (Ω)", color: "#7a8ba0" },
          grid: { color: "rgba(0, 240, 255, 0.1)" },
          ticks: { color: "#7a8ba0", font: { family: "Rajdhani" } },
        },
        y: {
          title: { display: true, text: "Temperatura (°C)", color: "#7a8ba0" },
          grid: { color: "rgba(0, 240, 255, 0.1)" },
          ticks: { color: "#7a8ba0", font: { family: "Rajdhani" } },
        },
      },
    },
  },
);

// Gera curva teórica para o gráfico de temperatura
function generateTheoreticalCurve() {
  const curve = [];
  for (let r = 1000; r <= 50000; r += 500) {
    const tempK = 1 / (1 / T0 + (1 / B_COEFFICIENT) * Math.log(r / R_REF));
    const tempC = tempK - 273.15;
    curve.push({ x: r, y: tempC });
  }
  return curve;
}

// Inicializa curva teórica
temperatureCurveChart.data.datasets[0].data = generateTheoreticalCurve();
temperatureCurveChart.update("none");

// ========== FUNÇÕES DE ATUALIZAÇÃO ==========
function updateMetrics(data) {
  // Atualiza cards de métricas
  document.getElementById("humidityValue").textContent =
    data.humidity.toFixed(1);
  document.getElementById("temperatureValue").textContent =
    data.temperature.toFixed(1);
  document.getElementById("termistorValue").textContent =
    data.termistor.toFixed(0);
  document.getElementById("termistorTempValue").textContent =
    data.termistor_temperature.toFixed(1);

  // Atualiza valores nos cards de cálculo
  document.getElementById("calc-adc").textContent = data.termistor.toFixed(0);
  const voltage = ((data.termistor * 3.3) / 4095).toFixed(3);
  document.getElementById("calc-voltage").textContent = voltage + " V";
  document.getElementById("calc-resistance").textContent =
    data.resistence.toFixed(0) + " Ω";

  // Calcula Kelvin
  const tempK =
    1 / (1 / T0 + (1 / B_COEFFICIENT) * Math.log(data.resistence / R_REF));
  document.getElementById("calc-kelvin").textContent = tempK.toFixed(2) + " K";
  document.getElementById("calc-celsius").textContent =
    data.termistor_temperature.toFixed(2) + " °C";
}

function updateCharts(data) {
  timeCounter++;
  const timeLabel = timeCounter.toString();

  // Atualiza gráfico de temperatura do termistor
  addDataPoint(termistorTempChart, timeLabel, data.termistor_temperature);

  // Atualiza gráfico de termistor ADC
  addDataPoint(termistorChart, timeLabel, data.termistor);

  // Atualiza gráfico de resistência
  addDataPoint(resistanceChart, timeLabel, data.resistence);

  // Atualiza ponto atual na curva de temperatura
  temperatureCurveChart.data.datasets[1].data = [
    { x: data.resistence, y: data.termistor_temperature },
  ];
  temperatureCurveChart.update("none");
}

function addDataPoint(chart, label, value) {
  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(value);

  // Mantém apenas os últimos MAX_DATA_POINTS pontos
  if (chart.data.labels.length > MAX_DATA_POINTS) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }

  chart.update("none");
}

// ========== HISTÓRICO DE DADOS ==========
function addToHistory(data) {
  const timestamp = new Date().toISOString();

  const record = {
    timestamp: timestamp,
    humidity: data.humidity,
    temperature: data.temperature,
    termistor: data.termistor,
    termistor_temperature: data.termistor_temperature,
    resistence: data.resistence,
  };

  dataHistory.push(record);

  // Mantém apenas os últimos MAX_HISTORY_RECORDS registros
  if (dataHistory.length > MAX_HISTORY_RECORDS) {
    dataHistory.shift();
  }
}

// ========== EXPORTAÇÃO CSV ==========
function exportToCSV() {
  if (dataHistory.length === 0) {
    alert("Nenhum dado disponível para exportação. Aguarde a coleta de dados.");
    return;
  }

  // Cabeçalho do CSV
  let csv =
    "Timestamp,Umidade (%),Temperatura (°C),Termistor (ADC),Temp. Termistor (°C),Resistência (Ω)\n";

  // Adiciona os dados
  dataHistory.forEach((record) => {
    csv += `${record.timestamp},`;
    csv += `${record.humidity.toFixed(2)},`;
    csv += `${record.temperature.toFixed(2)},`;
    csv += `${record.termistor.toFixed(0)},`;
    csv += `${record.termistor_temperature.toFixed(2)},`;
    csv += `${record.resistence.toFixed(2)}\n`;
  });

  // Cria blob e download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  // Gera nome do arquivo com data/hora
  const now = new Date();
  const filename = `esp32_data_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}.csv`;

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log(
    `✅ CSV exportado: ${filename} (${dataHistory.length} registros)`,
  );
}

// ========== WEBSOCKET ==========
export function connectWebSocket(instance) {
  console.log("Tentando conectar ao ESP32...");
  updateStatus("CONECTANDO...", false);

  try {
    ws = new WebSocket(`ws://${ESP32_IP}/ws`);

    ws.onopen = () => {
      console.log("✅ WebSocket conectado!");
      updateStatus("CONECTADO", true);
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Valida estrutura do JSON
        if (
          data.humidity !== undefined &&
          data.temperature !== undefined &&
          data.termistor !== undefined &&
          data.termistor_temperature !== undefined &&
          data.resistence !== undefined
        ) {
          instance.setNumiro(data.termistor_temperature);
          updateMetrics(data);
          updateCharts(data);
          addToHistory(data); // Adiciona ao histórico para CSV
        } else {
          console.warn("Dados incompletos recebidos:", data);
        }
      } catch (error) {
        console.error("Erro ao processar dados:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
      updateStatus("ERRO DE CONEXÃO", false);
    };

    ws.onclose = () => {
      console.log("WebSocket desconectado. Tentando reconectar...");
      updateStatus("DESCONECTADO", false);

      if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
          connectWebSocket(instance);
        }, 3000);
      }
    };
  } catch (error) {
    console.error("Erro ao criar WebSocket:", error);
    updateStatus("ERRO", false);
  }
}

function updateStatus(text, connected) {
  document.getElementById("statusText").textContent = text;
  const statusDot = document.querySelector(".status-dot");

  if (connected) {
    statusDot.style.background = "#06ffa5";
    statusDot.style.boxShadow = "0 0 10px #06ffa5";
  } else {
    statusDot.style.background = "#ff006e";
    statusDot.style.boxShadow = "0 0 10px #ff006e";
  }
}

// ========== ENVIAR COMANDOS ==========
function sendCommand(command) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const message = JSON.stringify({ command: command });
    ws.send(message);
    console.log(`📤 Comando enviado: ${command}`);
  } else {
    alert("WebSocket não está conectado!");
    console.error("Tentativa de enviar comando sem conexão WebSocket");
  }
}

const instance = await RaylibModuleFactory({
  canvas: document.getElementById("canvas"),
  // Opcional: capturar prints do C (printf) no console do JS
  print: (text) => console.log(`[Raylib]: ${text}`),
});
instance.setNumiro(10);
// ========== INICIALIZAÇÃO ==========
connectWebSocket(instance);

// Log inicial
console.log("🚀 ESP32 Monitor iniciado");
console.log(`📊 Histórico configurado para ${MAX_HISTORY_RECORDS} registros`);
