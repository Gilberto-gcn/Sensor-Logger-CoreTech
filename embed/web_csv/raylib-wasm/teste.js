import RaylibModuleFactory from "./quick_example.js";

let reconnectInterval = null;
let instance = null;

// Função dummy caso você não tenha definido a updateStatus
const updateStatus = (msg, isOk) => console.log(`Status: ${msg} (${isOk})`);

async function connectWebSocket(ESP32_IP) {
  try {
    const ws = new WebSocket(`ws://${ESP32_IP}/ws`);

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
        if (data.termistor_temperature !== undefined && instance) {
          // Atualiza o valor dentro da instância do Raylib (WASM)
          instance.setNumiro(data.termistor_temperature);
        }
      } catch (e) {
        console.error("Erro no parse:", e);
      }
    };

    ws.onclose = () => {
      updateStatus("DESCONECTADO", false);
      if (!reconnectInterval) {
        reconnectInterval = setInterval(() => connectWebSocket(ESP32_IP), 3000);
      }
    };

    ws.onerror = (err) => console.error("Erro WS:", err);
  } catch (error) {
    console.error("Erro ao criar WebSocket:", error);
  }
}

export async function initGame() {
  // const ESP32_IP = "10.229.209.118:80";
  const ESP32_IP = "localhost:8081";

  instance = await RaylibModuleFactory({
    canvas: document.getElementById("canvas"),
    print: (text) => console.log(`[Raylib]: ${text}`),
  });

  // Inicia a conexão
  connectWebSocket(ESP32_IP);
}

initGame();
