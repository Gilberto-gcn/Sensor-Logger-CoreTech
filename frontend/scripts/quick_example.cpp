#include "raylib.h"
#include <math.h>

#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/bind.h>
using namespace emscripten;
#endif

float counter = 0;

#define PARTICLES_ROW(i)                                                       \
  int i = 0;                                                                   \
  i < particles_rows;                                                          \
  i++

#define PARTICLES_COLL(j)                                                      \
  int j = 0;                                                                   \
  j < particles_cols;                                                          \
  j++

// 800, 450,
int width = 800;
int height = 450;

typedef struct Particle {
  Vector2 pos;
  float velocityX;
  float velocityY;
  float radius;
  Color color;
} Particle;

int particles_rows = 8;
int particles_cols = 4;

Particle **parts =
    (Particle **)malloc(particles_cols * particles_cols * sizeof(Particle *));

float dt = (float)1 / (float)60;

void InitParticles(Particle **particles) {
  for (PARTICLES_ROW(i)) {

    for (PARTICLES_COLL(j)) {
      particles[i][j].pos.x = (40 + 20 + i * (40 * 2 + 15));
      particles[i][j].pos.y = (40 + 20 + j * (40 * 2 + 15));
      particles[i][j].radius = 40;
      particles[i][j].color = YELLOW;
      particles[i][j].velocityX = 150;
      particles[i][j].velocityY = 50;
    }
  }
}

void DrawParts(Particle **particles) {
  for (PARTICLES_ROW(i)) {
    for (PARTICLES_COLL(j)) {
      DrawCircleV(particles[i][j].pos, particles[i][j].radius,
                  particles[i][j].color);
      DrawPixelV(particles[i][j].pos, RED);
    }
  }
}

void VelocityControlParticles(Particle **particles) {
  for (PARTICLES_ROW(i)) {
    for (PARTICLES_COLL(j)) {
      if (particles[i][j].pos.x >= (40 + 20 + i * (40 * 2 + 15) + 10) &&
          parts[i][j].velocityX > 0) {
        particles[i][j].velocityX *= -1;
      }
      if ((particles[i][j].pos.x <= (40 + 20 + i * (40 * 2 + 15) - 10)) &&
          parts[i][j].velocityX < 0) {
        particles[i][j].velocityX *= -1;
      }

      if (particles[i][j].pos.y >= (40 + 20 + j * (40 * 2 + 15) + 10) &&
          parts[i][j].velocityY > 0) {
        particles[i][j].velocityY *= -1;
      }
      if (particles[i][j].pos.y <= (40 + 20 + j * (40 * 2 + 15) - 10) &&
          parts[i][j].velocityY < 0) {
        particles[i][j].velocityY *= -1;
      }
    }
  }
}

void MovimentParticles(Particle **particles) {
  for (PARTICLES_ROW(i)) {
    for (PARTICLES_COLL(j)) {
      particles[i][j].pos.x =
          particles[i][j].pos.x + particles[i][j].velocityX * dt;
      particles[i][j].pos.y =
          particles[i][j].pos.y + particles[i][j].velocityY * dt;
    }
  }
}

void UpdateVelocity(Particle **particles, float numero) {
  for (PARTICLES_ROW(i)) {
    for (PARTICLES_COLL(j)) {
      particles[i][j].velocityX =
          (exp(numero / 6) / 3) * sin((rand() + 3) % 5 + 3.1415 / 2);
      particles[i][j].velocityY =
          (exp(numero / 5) / 4) * sin((rand() + 3) % 5 + 3.1415 / 2);
    }
  }
}

int setNumiro(float numero) {
  UpdateVelocity(parts, numero);
  counter = numero;
  return numero;
}
#ifdef __EMSCRIPTEN__
EMSCRIPTEN_BINDINGS(my_module) { function("setNumiro", &setNumiro); }
#endif

void UpdateDrawFrame() {
  // printf("%d\n", counter);
  BeginDrawing();
  ClearBackground(SKYBLUE);
  // UpdateVelocity(parts);
  VelocityControlParticles(parts);
  MovimentParticles(parts);
  DrawParts(parts);
  DrawFPS(0, 0);
  EndDrawing();
}

int main() {
  for (PARTICLES_ROW(i)) {
    parts[i] = (Particle *)malloc(particles_cols * sizeof(Particle));
  }

  srand(time(NULL));
  InitParticles(parts);
  InitWindow(800, 450, "Particles Simulator - Raylib");
  SetTargetFPS(60);

#ifdef __EMSCRIPTEN__
  emscripten_set_main_loop(UpdateDrawFrame, 0, 1);
#else
  while (!WindowShouldClose()) {
    UpdateDrawFrame();
  }
#endif

  CloseWindow();
  return 0;
}
