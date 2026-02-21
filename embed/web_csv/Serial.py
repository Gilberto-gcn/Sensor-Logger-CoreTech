import serial
import serial.tools.list_ports
import csv
import os
from datetime import datetime
import threading
import tkinter as tk
from tkinter import messagebox

rodando = False
ser = None
arquivo_csv = "dados.csv"

# -------- CORES--------
BG_PRINCIPAL = "#1e1e2f"   
BG_SECUNDARIO = "#2a2a40"
ROXO = "#9d4edd"
ROXO_CLARO = "#c77dff"
CINZA_TEXTO = "#e0e0e0"

# ---------------- DETECTAR PORTA ----------------
def detectar_porta_esp():
    portas = serial.tools.list_ports.comports()
    for porta in portas:
        desc = porta.description.lower()
        if "usb" in desc or "serial" in desc or "cp210" in desc or "ch340" in desc:
            return porta.device
    return None

# ---------------- CONECTAR SERIAL ----------------
def conectar_serial():
    global ser
    if ser is None or not ser.is_open:
        porta = detectar_porta_esp()
        if porta is None:
            messagebox.showerror("Erro", "ESP não encontrada")
            return False
        try:
            ser = serial.Serial(porta, 115200)
            status_label.config(text=f"Conectado em {porta}", fg=ROXO_CLARO)
            return True
        except:
            messagebox.showerror("Erro", "Falha ao abrir a porta serial")
            return False
    return True

# ---------------- LER SERIAL ----------------
def ler_serial():
    global rodando

    if not conectar_serial():
        return

    escrever_cabecalho = not os.path.exists(arquivo_csv) or os.stat(arquivo_csv).st_size == 0

    with open(arquivo_csv, "a", newline="") as arquivo:
        writer = csv.writer(arquivo, delimiter=";")

        if escrever_cabecalho:
            writer.writerow(["Data", "Temperatura", "Umidade"])

        while rodando:
            try:
                linha = ser.readline().decode(errors="ignore").strip()
                dados = linha.split(";")

                if len(dados) == 2:
                    temperatura, umidade = dados
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                    writer.writerow([timestamp, temperatura, umidade])
                    print(timestamp, temperatura, umidade)

            except:
                break

    status_label.config(text="Execução parada", fg="red")

# ---------------- BOTÕES ----------------
def iniciar():
    global rodando
    if not rodando:
        rodando = True
        status_label.config(text="Lendo dados...", fg=ROXO_CLARO)
        thread = threading.Thread(target=ler_serial, daemon=True)
        thread.start()

def parar():
    global rodando, ser
    rodando = False
    status_label.config(text="Execução parada", fg="red")


def efeito_hover(botao, cor_normal, cor_hover):
    botao.bind("<Enter>", lambda e: botao.config(bg=cor_hover))
    botao.bind("<Leave>", lambda e: botao.config(bg=cor_normal))

# ---------------- INTERFACE ----------------
janela = tk.Tk()
janela.title("ESP Data Logger")
janela.geometry("350x220")
janela.configure(bg=BG_PRINCIPAL)

titulo = tk.Label(
    janela,
    text="ESP Data Logger",
    bg=BG_PRINCIPAL,
    fg=ROXO_CLARO,
    font=("Arial", 16, "bold")
)
titulo.pack(pady=10)

status_label = tk.Label(
    janela,
    text="Aguardando conexão...",
    bg=BG_PRINCIPAL,
    fg=CINZA_TEXTO,
    font=("Arial", 10)
)
status_label.pack(pady=10)

btn_iniciar = tk.Button(
    janela,
    text="INICIAR",
    width=18,
    bg=ROXO,
    fg="white",
    activebackground=ROXO_CLARO,
    relief="flat",
    font=("Arial", 10, "bold"),
    command=iniciar
)
btn_iniciar.pack(pady=5)

btn_parar = tk.Button(
    janela,
    text="PARAR",
    width=18,
    bg=BG_SECUNDARIO,
    fg="white",
    activebackground="#444466",
    relief="flat",
    font=("Arial", 10, "bold"),
    command=parar
)
btn_parar.pack(pady=5)

efeito_hover(btn_iniciar, ROXO, ROXO_CLARO)
efeito_hover(btn_parar, BG_SECUNDARIO, "#444466")

janela.mainloop()
