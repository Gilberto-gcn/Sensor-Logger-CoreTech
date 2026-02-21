# Projeto Logger
<img align="center"  src="https://github.com/Luciomelo1407/raylib-wasm/blob/main/assets/WhatsApp%20Image%202026-02-10%20at%2022.28.32(4).jpeg?raw=true">

<img align="center"  src="https://github.com/Luciomelo1407/raylib-wasm/blob/main/assets/Captura%20de%20tela%20de%202026-02-15%2013-49-30.png?raw=true">
<img align="center"  src="https://github.com/Luciomelo1407/raylib-wasm/blob/main/assets/Captura%20de%20tela%20de%202026-02-15%2013-49-42.png?raw=true">
<img align="center"  src="https://github.com/Luciomelo1407/raylib-wasm/blob/main/assets/Captura%20de%20tela%20de%202026-02-15%2013-49-57.png?raw=true">
<img align="center"  src="https://github.com/Luciomelo1407/raylib-wasm/blob/main/assets/Captura%20de%20tela%20de%202026-02-15%2013-50-18.png?raw=true">
<img align="center"  src="https://github.com/Luciomelo1407/raylib-wasm/blob/main/assets/Captura%20de%20tela%20de%202026-02-15%2013-50-27.png?raw=true">




## Objetivo:

Esse projeto é um sistema de logger para dados de temperatura e pressão, a ideia principal era escrever os dados em um csv, porém, acabou se tranformando em um estudo de como medir temperatura e a demonstração de que a temperatura é nada mais e nada a menos que o grau de aditação das moléculas de certa maneira a “velocidade” a qual as moléculas se movem.

## Lista de materiais:

- ESP32
- Resistor de 10k e 5K ohms
- Termistor NTC 10k
- DHT11
- LCD

siga o esqurmático na raiz do projeto para fazer a montagem

## Para rodar o projeto:

Basta carregar o esp com o main.cpp na pasta embed, usando a arduino ide, lembre de baixar as dependencias no headder.

Para abrir o projeto web basta iniciar um servidor web python na pasta frontend:

 

```bash
python -m http.server PORT
```

lembre-se de ajustar o ip do seu esp32 no arquivo frontend/scripts/script.js:

```java script
// ========== CONFIGURAÇÃO ==========
const ESP32_IP = "localhost:8081"; // <<< CONFIGURE SEU IP AQUI
const MAX_DATA_POINTS = 50;
const MAX_HISTORY_RECORDS = 100; // Máximo de registros históricos para CSV
const R_REF = 10000; // 10kΩ
const B_COEFFICIENT = 3950; // Beta do NTC
const T0 = 298.15; // 25°C em Kelvin
const VCC = 3.3;
// ========
```

Caso queira alterar algo no simulador de partículas recomendo seguir a dpcumentação do raylib, https://github.com/raysan5/raylib e do emscriptem, [https://emscripten.org/docs/index.html](https://emscripten.org/docs/index.html), o arquivo run em frontend/scrits pode te ajudar.
