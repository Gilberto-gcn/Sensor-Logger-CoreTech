const WebSocket = require("ws");

// Cria o servidor na porta 80
const wss = new WebSocket.Server({ port: 8081 });

console.log("🚀 Simulador ESP32 rodando na porta 8081...");
console.log("Aguardando conexão do frontend...");

wss.on("connection", (ws) => {
  console.log("✅ Frontend conectado! Iniciando envio de telemetria...");

  // Função para gerar dados aleatórios realistas
  const sendData = () => {
    if (ws.readyState === WebSocket.OPEN) {
      const mockData = {
        humidity: parseFloat((Math.random() * 20 + 40).toFixed(2)), // 40-60%
        temperature: parseFloat((Math.random() * 5 + 25).toFixed(2)), // 25-30°C
        termistor: Math.floor(Math.random() * 1024), // 0-1023 (ADC)
        termistor_temperature: 20, // 20-30°C
        resistence: Math.floor(Math.random() * 5000 + 1000), // 1k-6k ohms
      };

      ws.send(JSON.stringify(mockData));
      console.log("Enviado:", mockData.termistor_temperature + "°C");
    }
  };

  // Envia dados a cada 1000ms (1 segundo)
  const interval = setInterval(sendData, 1000);

  ws.on("close", () => {
    console.log("❌ Frontend desconectado.");
    clearInterval(interval);
  });

  ws.on("error", (err) => {
    console.error("Erro no Socket:", err.message);
  });
});
